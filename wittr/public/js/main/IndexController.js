// Configuration of the app
import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('wittr', 1, function (upgradeDb) {
    let store = upgradeDb.createObjectStore('witters', {
      keyPath: 'id'
    });

    store.createIndex('by-date', 'time');
  });
}

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._openSocket();
  this._dbPromise = openDatabase();
  this._registerServiceWorker();

  let indexController = this;

  this._showCachedMessages().then(function () {
    indexController._openSocket();
  });
}

IndexController.prototype._registerServiceWorker = function () {
  if (!navigator.serviceWorker) return;

  let indexController = this;

  navigator.serviceWorker.register('/sw.js')
    .then(function (reg) {
      if (!navigator.serviceWorker.controller) {
        return null;
      }

      if (reg.waiting) {
        return indexController._updateReady(reg.waiting);
      }

      if (reg.installing) {
        return indexController._trackInstalling(reg.installing);
      }

      reg.addEventListener('updatefound', function () {
        return indexController._trackInstalling(reg.installing);
      });
    });

  let refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (refreshing) return null;

    window.location.reload();
    return refreshing = true;
  });
};

IndexController.prototype._showCachedMessages = function () {
  let indexController = this;

  return this._dbPromise.then(function (db) {
    // if we're already showing posts, eg shift-refresh
    // or the very first load, there's no point fetching
    // posts from IDB
    if (!db || indexController._postsView.showingPosts()) return;

    let postsByDateIndex = db.transaction('witters')
      .objectStore('witters')
      .index('by-date');

    return postsByDateIndex.getAll();
  })
    .then(function (postsIndexedByDate) {
      return indexController._postsView.addPosts(postsIndexedByDate.reverse());
    });
}

IndexController.prototype._trackInstalling = function (worker) {
  let indexController = this;

  worker.addEventListener('stateChange', function () {
    if (worker.state == 'installed') {
      return indexController._updateReady(worker);
    }
  });
};

IndexController.prototype._updateReady = function (worker) {
  let toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer
    .then(function (answer) {
      if (answer != 'refresh') return null;

      return worker.postMessage({ action: 'skipWaiting' });
    });
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function () {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function () {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function (event) {
    requestAnimationFrame(function () {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function () {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function () {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function (data) {
  var messages = JSON.parse(data);

  this._dbPromise.then(function (db) {
    if (!db) return null;

    let tx = db.transaction('witters', 'readwrite');
    let wittersStore = tx.objectStore('witters');

    messages.map(function (message) {
      wittersStore.put(message);
    });

    // keep the newest 30 entries in 'witters'
    // but delete the rest
    wittersStore
      .index('by-date')
      .openCursor(null, 'prev')
      .then(function (cursor) {
        return cursor.advance(30);
      })
      .then(function deleteRest(cursor) {
        if (!cursor) return;
        cursor.delete();
        return cursor
          .continue()
          .then(deleteRest);
      });

    return tx.complete;
  }).then(function () {
    console.log("Messages added!");
  });

  this._postsView.addPosts(messages);
};