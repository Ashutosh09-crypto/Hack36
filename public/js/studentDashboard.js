let lis = document.querySelectorAll("li");

for (let li in lis) {
    li.addEventListener('click', () => {
        document.getElementsByClassName("active").classList.remove("active");
        li.classList.add("active");
    })
}