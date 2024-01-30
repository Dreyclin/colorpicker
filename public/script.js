document.addEventListener("DOMContentLoaded", function () {
    const items = document.querySelectorAll('.item');
    items.forEach((item, index) => {
        item.addEventListener("click", function () {
            const color = item.querySelector('input[name="color"]').value.substring(1);

            const newURL = `pallete/${color}`;

            history.pushState(null, null, newURL);
            location.reload();
        });
    });
});