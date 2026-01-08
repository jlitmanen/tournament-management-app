$(document).ready(function() {
    $('.clickable-row').click(function() {
        const rowId = $(this).data('row-id');
        $(`#${rowId}`).toggle();
    });
});

function playerFilter() {
    const selectedPlayerId = document.getElementById("playerSelect").value;
    const url = `/results/1?pid=${selectedPlayerId}`;
    window.location.href = url;
}

function showHideRow(row) {
    $("#" + row).toggle();
}

function toggle() {
    var ele = document.getElementById("mySidebar");
    ele.style.display = ele.style.display == "block" ? "none" : "block";
}

function openTab(event, tabName) {
    const tabContents = Array.from(document.getElementsByClassName("tabcontent"));
    tabContents.forEach(content => {
        content.style.display = "none";
    });

    const tabButtons = Array.from(document.getElementsByClassName("list-group-item"));
    tabButtons.forEach(button => {
        button.classList.remove("active");
    });

    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.style.display = "block";
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-bs-theme', savedTheme);
    updateIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });

    function updateIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.replace('fa-moon-o', 'fa-sun-o');
        } else {
            themeIcon.classList.replace('fa-sun-o', 'fa-moon-o');
        }
    }
});
