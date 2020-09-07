import idb from 'idb';

var dbPromise = idb.open('test-db', 3, function (upgradeDb) {
  switch (upgradeDb.oldVersion) {
    case 0:
      var keyValStore = upgradeDb.createObjectStore('keyval');
      keyValStore.put("world", "hello");

    // eslint-disable-next-line no-fallthrough
    case 1:
      upgradeDb.createObjectStore('people', { keyPath: 'name' });

    // eslint-disable-next-line no-fallthrough
    case 2:
      var peopleStore = upgradeDb.transaction.objectStore('people');
      peopleStore.createIndex('animal', 'favoriteAnimal');
  }
});

// read "hello" in "keyval"
dbPromise.then(function (db) {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');
  return keyValStore.get('hello');
}).then(function (val) {
  console.log('The value of "hello" is:', val);
});

// set "foo" to be "bar" in "keyval"
dbPromise.then(function (db) {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('bar', 'foo');
  return tx.complete;
}).then(function () {
  console.log('Added foo:bar to keyval');
});

dbPromise.then(function (db) {
  // TODO: in the keyval store, set
  // "favoriteAnimal" to your favourite animal
  // eg "cat" or "dog"
  let tx = db.transaction('keyval', 'readwrite');
  let keyValStore = tx.objectStore('keyval');
  keyValStore.put('dog', 'favoriteAnimal');
  return tx.complete;
}).then(function () {
  console.log('Added favoriteAnimal:dog to keyval');
});

dbPromise.then(function (db) {
  let tx = db.transaction('people', 'readwrite');
  let peopleStore = tx.objectStore('people');

  // The key will be the name as specified in the definition
  // of the store
  peopleStore.put({
    name: 'Sam Munoz',
    age: 25,
    favoriteAnimal: 'dog'
  });

  peopleStore.put({
    name: 'Marc Stone',
    age: 39,
    favoriteAnimal: 'cat'
  });

  peopleStore.put({
    name: 'Lillie Wolfe',
    age: 28,
    favoriteAnimal: 'dog'
  });

  peopleStore.put({
    name: 'Susan Keller',
    age: 34,
    favoriteAnimal: 'cat'
  });

  return tx.complete;
}).then(() => {
  console.log("People added");
});

dbPromise.then(function (db) {
  let tx = db.transaction('people');
  let peopleStore = tx.objectStore('people');
  let animalIndex = peopleStore.index('animal');

  return animalIndex.getAll('cat');
}).then(function (people) {
  console.log('People: ', people);
});