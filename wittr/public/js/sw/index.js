self.addEventListener("fetch", function (event) {
  event.respondWith(
    new Response(
      "<p>Hello world</p>" +
      "<br />" +
      "<p class='a-winner-is-me'>Me</p>",
      {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      })
  );
});