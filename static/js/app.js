document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseNotes = [];
    let activeNote = null;
    let currentCategoryFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const notesListContainer = document.getElementById('notes-list');
    const detailsPanel = document.getElementById('details-panel');
    const btnRefresh = document.getElementById('btn-refresh');
    
    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const tweetCounter = document.getElementById('tweet-counter');
    const btnCancelTweet = document.getElementById('btn-cancel-tweet');
    const btnSubmitTweet = document.getElementById('btn-submit-tweet');
    const modalClose = document.querySelector('.modal-close');

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // Load initial data
    fetchReleaseNotes();

    // Event Listeners
    btnRefresh.addEventListener('click', () => fetchReleaseNotes(true));
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderList();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryFilter = btn.dataset.category;
            renderList();
        });
    });

    // Close Tweet Modal
    modalClose.addEventListener('click', closeTweetModal);
    btnCancelTweet.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeTweetModal();
    });

    // Handle Tweet Input Validation
    tweetTextarea.addEventListener('input', updateTweetCounter);

    // Submit Tweet
    btnSubmitTweet.addEventListener('click', submitTweet);

    // Functions
    async function fetchReleaseNotes(force = false) {
        if (btnRefresh.classList.contains('loading')) return;
        
        btnRefresh.classList.add('loading');
        
        try {
            const response = await fetch(`/api/notes?force=${force}`);
            if (!response.ok) throw new Error('Failed to fetch release notes');
            
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            
            releaseNotes = data.notes.map(note => {
                const categories = detectCategories(note);
                return { ...note, categories };
            });

            showToast(data.cached ? 'Loaded release notes (Cached)' : 'Release notes refreshed successfully!', 'success');
            
            if (releaseNotes.length > 0) {
                // If there's an active note, try to keep it, otherwise set first as active
                if (!activeNote || !releaseNotes.some(n => n.id === activeNote.id)) {
                    activeNote = releaseNotes[0];
                } else {
                    activeNote = releaseNotes.find(n => n.id === activeNote.id);
                }
                renderDetails();
            }
            renderList();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showToast(`Error loading release notes: ${error.message}`, 'error');
        } finally {
            btnRefresh.classList.remove('loading');
        }
    }

    function detectCategories(note) {
        const categories = new Set();
        const html = note.content || '';
        const text = note.title + ' ' + html;
        
        if (/strong\s*>\s*(Feature)\s*:?/i.test(html) || /Feature\s*:/i.test(note.title)) {
            categories.add('feature');
        }
        if (/strong\s*>\s*(Fix|Fixed)\s*:?/i.test(html) || /Fix\s*:/i.test(note.title)) {
            categories.add('fix');
        }
        if (/strong\s*>\s*(Change|Changed)\s*:?/i.test(html) || /Change\s*:/i.test(note.title)) {
            categories.add('change');
        }
        if (/strong\s*>\s*(Deprecation|Deprecated)\s*:?/i.test(html) || /Deprecation\s*:/i.test(note.title)) {
            categories.add('deprecation');
        }
        
        return Array.from(categories);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            // Check if it's already a clean string or a ISO timestamp
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Try clean up if Google sends a string like "June 15, 2026"
                return dateStr;
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function renderList() {
        notesListContainer.innerHTML = '';
        
        const filtered = releaseNotes.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchQuery) || 
                                  note.content.toLowerCase().includes(searchQuery);
            
            const matchesCategory = currentCategoryFilter === 'all' || 
                                    note.categories.includes(currentCategoryFilter);
                                    
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0) {
            notesListContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No release notes match your criteria.
                </div>
            `;
            return;
        }

        filtered.forEach(note => {
            const item = document.createElement('div');
            item.className = `note-item ${activeNote && activeNote.id === note.id ? 'active' : ''}`;
            
            // Build badges HTML
            const badgesHtml = note.categories.map(cat => 
                `<span class="badge-tag badge-${cat}" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">${cat}</span>`
            ).join('');
            
            // Format dates
            const dateDisplay = formatDate(note.published || note.updated);
            
            // Snippet extraction
            const snippet = extractSnippet(note.content);

            item.innerHTML = `
                <div class="note-item-meta">
                    <span class="note-item-date">${dateDisplay}</span>
                    <div style="display: flex; gap: 0.25rem;">${badgesHtml}</div>
                </div>
                <h4 class="note-item-title">${note.title}</h4>
                <p class="note-item-snippet">${snippet}</p>
            `;
            
            item.addEventListener('click', () => {
                activeNote = note;
                document.querySelectorAll('.note-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderDetails();
            });
            
            notesListContainer.appendChild(item);
        });
    }

    function renderDetails() {
        if (!activeNote) {
            detailsPanel.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    <h3>No Update Selected</h3>
                    <p>Select a release note from the list on the left to read details.</p>
                </div>
            `;
            return;
        }

        const dateDisplay = formatDate(activeNote.published || activeNote.updated);
        const formattedContent = formatReleaseHTML(activeNote.content);

        detailsPanel.innerHTML = `
            <div class="details-header">
                <div class="details-header-info">
                    <span class="details-date">${dateDisplay}</span>
                    <h2 class="details-title">${activeNote.title}</h2>
                </div>
                <div class="details-actions">
                    <button id="btn-tweet-action" class="btn btn-tweet">
                        <svg style="width: 16px; height: 16px; fill: currentColor;" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Tweet Note
                    </button>
                    <a href="${activeNote.link}" target="_blank" class="btn btn-secondary">
                        View Source
                    </a>
                </div>
            </div>
            <div class="details-body">
                <div class="release-note-content">
                    ${formattedContent}
                </div>
            </div>
        `;

        // Wire up tweet action
        document.getElementById('btn-tweet-action').addEventListener('click', openTweetModal);
    }

    function extractSnippet(html) {
        if (!html) return 'No content details available.';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Try to get first list item or paragraph
        const li = tempDiv.querySelector('li');
        if (li) return li.textContent.trim();
        
        const p = tempDiv.querySelector('p');
        if (p) return p.textContent.trim();
        
        return tempDiv.textContent.substring(0, 150).trim() + '...';
    }

    function formatReleaseHTML(html) {
        if (!html) return 'No content details available.';
        let formatted = html;
        
        // Insert custom classes and badges into the HTML to match design system
        formatted = formatted.replace(/<strong>\s*(Feature)\s*:?\s*<\/strong>/gi, '<span class="badge-tag badge-feature">Feature</span>');
        formatted = formatted.replace(/<strong>\s*(Fix|Fixed)\s*:?\s*<\/strong>/gi, '<span class="badge-tag badge-fix">Fix</span>');
        formatted = formatted.replace(/<strong>\s*(Change|Changed)\s*:?\s*<\/strong>/gi, '<span class="badge-tag badge-change">Change</span>');
        formatted = formatted.replace(/<strong>\s*(Deprecation|Deprecated)\s*:?\s*<\/strong>/gi, '<span class="badge-tag badge-deprecation">Deprecation</span>');
        
        return formatted;
    }

    // Modal Operations
    function openTweetModal() {
        if (!activeNote) return;

        const dateDisplay = formatDate(activeNote.published || activeNote.updated);
        const snippet = extractSnippet(activeNote.content);
        const cleanedSnippet = snippet.replace(/^(Feature|Fix|Change|Changed|Deprecation)\s*:\s*/i, '');
        
        // Build initial tweet text
        const titleText = `BigQuery Update (${dateDisplay})`;
        const maxSnippetLen = 280 - (titleText.length + 35); // Allow room for tags and URL
        const snippetTruncated = cleanedSnippet.length > maxSnippetLen ? 
            cleanedSnippet.substring(0, maxSnippetLen - 3) + '...' : 
            cleanedSnippet;
            
        const initialTweet = `📢 ${titleText}:\n"${snippetTruncated}"\n\n#BigQuery #GCP`;
        
        tweetTextarea.value = initialTweet;
        updateTweetCounter();

        tweetModal.classList.add('active');
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
    }

    function updateTweetCounter() {
        const text = tweetTextarea.value;
        // Twitter always shortens links to 23 characters, so if there is a URL, it adds 23 chars. 
        // We will pass the link to Twitter intent as a separate URL parameter, which Twitter appends.
        // So the character limit applies to the text + 24 characters (1 space + 23 char shortened link).
        const urlLength = 24; 
        const totalLength = text.length + urlLength;
        const remaining = 280 - totalLength;
        
        tweetCounter.textContent = `${totalLength} / 280 characters`;
        
        tweetCounter.classList.remove('warning', 'error');
        if (remaining < 30 && remaining >= 0) {
            tweetCounter.classList.add('warning');
        } else if (remaining < 0) {
            tweetCounter.classList.add('error');
        }
        
        btnSubmitTweet.disabled = totalLength > 280;
        btnSubmitTweet.style.opacity = totalLength > 280 ? '0.5' : '1';
        btnSubmitTweet.style.cursor = totalLength > 280 ? 'not-allowed' : 'pointer';
    }

    function submitTweet() {
        if (!activeNote) return;
        const text = tweetTextarea.value;
        const url = activeNote.link;
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank');
        closeTweetModal();
        showToast('Redirected to Twitter to publish your Tweet!', 'success');
    }

    // Toast Notifications
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast`;
        
        const icon = type === 'success' ? 
            `<svg style="width:16px;height:16px;fill:#34a853;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` :
            `<svg style="width:16px;height:16px;fill:#ea4335;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
            
        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow for transition
        setTimeout(() => toast.classList.add('active'), 10);
        
        // Remove toast
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
