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

            // Store state information that we'll need when navigating back
            const state = {
                url: url,
                fragmentId: fragmentId,
            };

            // Push the new URL to the browser's history with state information
            history.pushState(state, '', url);

            loadFragment(url, fragmentId);
        });
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.url && event.state.fragmentId) {
            loadFragment(event.state.url, event.state.fragmentId);

            // Update active link when navigating with browser controls
            document.querySelectorAll('a[data-fragment]').forEach(function (link) {
                link.classList.remove('active-fragment');
                if (link.getAttribute('href') === event.state.url) {
                    link.classList.add('active-fragment');
                }
            });
        }
    });
}

// Load fragment content
function loadFragment(url, fragmentId) {
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

// Run fragment manually (public function for external use)
function runFragment(url, fragmentId) {
    // Store state information
    const state = {
        url: url,
        fragmentId: fragmentId,
    };

    // Update the history
    history.pushState(state, '', url);

    // Update active link
    document.querySelectorAll('a[data-fragment]').forEach(function (link) {
        link.classList.remove('active-fragment');
        if (link.getAttribute('href') === url) {
            link.classList.add('active-fragment');
        }
    });

    // Load the fragment content
    loadFragment(url, fragmentId);
}

// Call the function to set up the link interception
fragment();
