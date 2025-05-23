// Cache for preloaded content
const preloadCache = new Map();

// Function to intercept link clicks and load content
function fragment() {
    // Set up preloading on hover
    document.addEventListener('mouseover', function (event) {
        const link = event.target.closest('a[data-fragment]');
        if (!link) return; // Not a fragment link

        const url = link.getAttribute('href');
        const fragmentId = link.getAttribute('data-fragment');

        // Create a unique key for this url+fragment combination
        const cacheKey = `${url}#${fragmentId}`;

        // Only preload if not already in cache
        if (!preloadCache.has(cacheKey)) {
            preloadContent(url, fragmentId);
        }
    });

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

        // Use preloaded content if available
        const cacheKey = `${url}#${fragmentId}`;
        if (preloadCache.has(cacheKey)) {
            applyPreloadedContent(url, fragmentId);
        } else {
            loadFragment(url, fragmentId);
        }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (event) {
        if (event.state && event.state.url && event.state.fragmentId) {
            // Check if we have this in cache first
            const cacheKey = `${event.state.url}#${event.state.fragmentId}`;
            if (preloadCache.has(cacheKey)) {
                applyPreloadedContent(event.state.url, event.state.fragmentId);
            } else {
                loadFragment(event.state.url, event.state.fragmentId);
            }

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

// Preload content without applying it
function preloadContent(url, fragmentId) {
    const cacheKey = `${url}#${fragmentId}`;

    // If already preloading or in cache, don't start again
    if (preloadCache.has(cacheKey)) return;

    // Placeholder to indicate preloading in progress
    preloadCache.set(cacheKey, null);

    fetch(url)
        .then((response) => response.text())
        .then((html) => {
            // Create a temporary DOM element to parse the fetched HTML
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Get the title
            var titleElement = tempDiv.querySelector('title');
            var title = titleElement ? titleElement.innerText : '';

            // Get the fragment content
            var fragmentElement = tempDiv.querySelector(`#${fragmentId}`);
            if (!fragmentElement) {
                console.error(`Preload: Fragment #${fragmentId} not found in the fetched page`);
                preloadCache.delete(cacheKey); // Remove failed preload
                return;
            }

            // Store the parsed content in the cache
            preloadCache.set(cacheKey, {
                title: title,
                content: fragmentElement.innerHTML,
                timestamp: Date.now(),
            });
        })
        .catch((error) => {
            console.error('Error preloading the fragment:', error);
            preloadCache.delete(cacheKey); // Remove failed preload
        });
}

// Apply preloaded content to the page
function applyPreloadedContent(url, fragmentId) {
    const cacheKey = `${url}#${fragmentId}`;
    const cachedData = preloadCache.get(cacheKey);

    if (!cachedData) {
        // If preloading is in progress (null) or failed, fall back to regular loading
        loadFragment(url, fragmentId);
        return;
    }

    // Update the target element
    var targetElement = document.querySelector(`#${fragmentId}`);
    if (!targetElement) {
        console.error(`Target element #${fragmentId} not found on the current page`);
        return;
    }

    // Apply the content
    targetElement.innerHTML = cachedData.content;

    // Update the title if available
    if (cachedData.title) {
        document.title = cachedData.title;
    }

    // Smooth scroll to the top of the page
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });

    // Emit a custom event after content is loaded and URL is updated
    const event = new CustomEvent('fragment:loaded', {
        detail: {
            url: url,
            fragmentId: fragmentId,
            fromCache: true,
        },
    });
    document.dispatchEvent(event);

    // Optional: Consider cleaning old cache entries periodically
    cleanOldCacheEntries();
}

// Clean up old cache entries (older than 5 minutes)
function cleanOldCacheEntries() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    preloadCache.forEach((value, key) => {
        if (value && value.timestamp && now - value.timestamp > maxAge) {
            preloadCache.delete(key);
        }
    });
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

    // Check cache first
    const cacheKey = `${url}#${fragmentId}`;
    if (preloadCache.has(cacheKey)) {
        applyPreloadedContent(url, fragmentId);
    } else {
        loadFragment(url, fragmentId);
    }
}

// Call the function to set up the link interception
fragment();
