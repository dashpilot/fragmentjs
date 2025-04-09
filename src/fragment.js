// Function to intercept link clicks and load content
function fragment() {
    // Use event delegation for handling clicks on fragment links
    document.addEventListener('click', function (event) {
        // Find the closest anchor with data-fragment attribute
        const link = event.target.closest('a[data-fragment]');
        if (!link) return; // Not a fragment link

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
            var fragmentElement = tempDiv.querySelector(`#${fragmentId}`);
            if (!fragmentElement) {
                console.error(`Fragment #${fragmentId} not found in the fetched page`);
                return;
            }
            var newContent = fragmentElement.innerHTML;

            // Update the specified fragment ID on the current page
            var targetElement = document.querySelector(`#${fragmentId}`);
            if (!targetElement) {
                console.error(`Target element #${fragmentId} not found on the current page`);
                return;
            }
            targetElement.innerHTML = newContent;

            // Extract and update the document title
            var titleElement = tempDiv.querySelector('title');
            if (titleElement) {
                document.title = titleElement.innerText;
            }

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
