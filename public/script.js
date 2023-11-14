document.addEventListener("DOMContentLoaded", function () {
    const items = document.querySelectorAll('.item');
    items.forEach((item, index) => {
        item.addEventListener("click", function () {
            // Handle the click action here
            const color = item.querySelector('input[name="color"]').value.substring(1);


            // You can navigate to a different page or perform other actions using JavaScript
            // For example, if you want to navigate to the color's page, you can use:
            const newURL = `/${color}`;

            history.pushState(null, null, newURL);
            location.reload();
        });
    });
});