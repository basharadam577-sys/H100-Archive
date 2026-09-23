document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector("nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      nav.classList.toggle("active");
    });
  }

  const links = document.querySelectorAll("nav a");

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      if (nav) {
        nav.classList.remove("active");
      }
    });
  });

  const year = document.querySelector("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const backToTop = document.querySelector("#backToTop");

  if (backToTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 300) {
        backToTop.style.display = "block";
      } else {
        backToTop.style.display = "none";
      }
    });

    backToTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});
update app.ja