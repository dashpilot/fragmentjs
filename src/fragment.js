// Function to intercept link clicks and load content
function fragment() {
    document.querySelectorAll('a[data-fragment]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent the default link behavior

            var url = link.getAttribute('href');
            var fragmentId = link.getAttribute('data-fragment');

            document.querySelectorAll('a[data-fragment]').forEach(function (link) {
                link.classList.remove('active-fragment');
            });
            link.classList.add('active-fragment');

            runFragment(url, fragmentId);
        });
    });
}

// Run fragment manually
function runFragment(url, fragmentId) {
    fetch(url)
        .then((response) => response.text())
        .then((html) => {
            // Create a temporary DOM element to parse the fetched HTML
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Extract the content of the specified fragment ID
            var newContent = tempDiv.querySelector(`#${fragmentId}`).innerHTML;

            // Update the specified fragment ID on the current page
            document.querySelector(`#${fragmentId}`).innerHTML = newContent;

            // Extract and update the document title
            var newTitle = tempDiv.querySelector('title').innerText;
            document.title = newTitle;

            // Push the new URL to the browser's history
            history.pushState(null, '', url);

            // Smooth scroll to the top of the page
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });

            // Emit a custom event after content is loaded and URL is updated
            const event = new CustomEvent('fragment:loaded', { detail: { url: url, fragmentId: fragmentId } });
            document.dispatchEvent(event);
        })
        .catch((error) => console.error('Error fetching the fragment:', error));
}

// Call the function to set up the link interception
fragment();
