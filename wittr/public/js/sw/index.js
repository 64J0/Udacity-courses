self.addEventListener("fetch", function (event) {
  event.respondWith(
    new Response("Hello <b>world</b>", {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    })
  );
});