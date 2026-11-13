const newsletterForm = document.getElementById("newsletterForm");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("newsletterEmail").value;
        const message = document.getElementById("newsletterMessage");

        message.textContent = "Thank you for subscribing!";

        newsletterForm.reset();
    });
}


const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {

    const themeIcon = themeToggle.querySelector("i");
    const themeText = themeToggle.querySelector("span");

    function applyTheme(isDark) {

        document.body.classList.toggle("dark-theme", isDark);

        if (isDark) {
            themeIcon.className = "fa-solid fa-sun";
            themeText.textContent = "Light";
            themeToggle.setAttribute(
                "aria-label",
                "Switch to light theme"
            );
        } else {
            themeIcon.className = "fa-solid fa-moon";
            themeText.textContent = "Dark";
            themeToggle.setAttribute(
                "aria-label",
                "Switch to dark theme"
            );
        }

    }

    const savedTheme = localStorage.getItem("smartAcademyTheme");

    applyTheme(savedTheme === "dark");

    themeToggle.addEventListener("click", function () {

        const isDark = !document.body.classList.contains("dark-theme");

        applyTheme(isDark);

        localStorage.setItem(
            "smartAcademyTheme",
            isDark ? "dark" : "light"
        );

    });

}