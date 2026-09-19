let omniCore = {};

document.addEventListener('DOMContentLoaded', async () => {
    const arbitrageList = document.getElementById('arbitrage-list');
    const dbStatus = document.getElementById('db-status');
    
    // Fetch Core Data statically
    try {
        const res = await fetch('./api/omni-core.json');
        omniCore = await res.json();
        
        // Render Arbitrage
        arbitrageList.innerHTML = '';
        if(omniCore.Cross_Country_Arbitrage_Metrics) {
            for(const [key, val] of Object.entries(omniCore.Cross_Country_Arbitrage_Metrics)) {
                const li = document.createElement('li');
                li.innerHTML = `<span class="text-cyber font-semibold">${key.replace(/_/g, ' ')}:</span> ${val}`;
                arbitrageList.appendChild(li);
            }
        }
        
        // Render Status
        dbStatus.innerHTML = `
            <p><span class="font-semibold text-gray-400">Engine:</span> ${omniCore.Engine}</p>
            <p><span class="font-semibold text-gray-400">Status:</span> ${omniCore.Status}</p>
            <p><span class="font-semibold text-gray-400">Active Countries:</span> ${Object.keys(omniCore.Countries || {}).join(', ')}</p>
            <p><span class="font-semibold text-gray-400">Total Nodes:</span> ${omniCore.Total_Nodes_Estimated}</p>
        `;
    } catch(e) {
        arbitrageList.innerHTML = `<li class="text-red-500">Error loading DB</li>`;
        dbStatus.innerHTML = `<p class="text-red-500">Offline</p>`;
    }

    // Handle Search locally
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results-container');
    const welcomePanel = document.getElementById('welcome-panel');

    const performSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        if(!query) return;

        welcomePanel.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        resultsContainer.style.display = 'flex';

        if(!omniCore.Countries) {
            resultsContainer.innerHTML = `<p class="text-red-500">Database not initialized.</p>`;
            return;
        }

        const results = [];
        for (const [countryName, dbArr] of Object.entries(omniCore.Countries)) {
            const db = dbArr[0];
            
            // Search Venues
            db.Regional_Micro_Mapping && db.Regional_Micro_Mapping.forEach(v => {
                if ((v.Name && v.Name.toLowerCase().includes(query)) || 
                    (v.Location && v.Location.toLowerCase().includes(query)) || 
                    (v.Core_Mechanic && v.Core_Mechanic.toLowerCase().includes(query))) {
                    results.push({ type: 'Venue', country: countryName, data: v });
                }
            });

            // Search Defenses / Extortion / Scams
            const defenseKeys = Object.keys(db).filter(k => k.includes('Defense') || k.includes('Scam'));
            defenseKeys.forEach(dk => {
                db[dk] && db[dk].forEach(d => {
                    if ((d.Threat && d.Threat.toLowerCase().includes(query)) || 
                        (d.Counter_Protocol && d.Counter_Protocol.toLowerCase().includes(query)) ||
                        (d.Data && d.Data.toLowerCase().includes(query))) {
                        results.push({ type: 'Defense Protocol', country: countryName, data: d });
                    }
                });
            });

            // Search Personas
            db.Massive_Persona_Matrix && db.Massive_Persona_Matrix.forEach(d => {
                if(d.Data && d.Data.toLowerCase().includes(query)) {
                    results.push({ type: 'Persona', country: countryName, data: d });
                }
            });
            
            // Search Prices
            db.Massive_Pricing_Grid && db.Massive_Pricing_Grid.forEach(d => {
                if(d.Data && d.Data.toLowerCase().includes(query)) {
                    results.push({ type: 'Pricing', country: countryName, data: d });
                }
            });
        }

        const topResults = results.slice(0, 100);

        if(topResults.length === 0) {
            resultsContainer.innerHTML = `<p class="text-red-400">No nodes found for "${query}".</p>`;
            return;
        }

        resultsContainer.innerHTML = '';
        topResults.forEach(r => {
            const el = document.createElement('div');
            el.className = "bg-gray-800 p-4 rounded border border-gray-700 hover:border-cyber transition";
            
            let contentHTML = '';
            if(r.type === 'Venue') {
                contentHTML = `
                    <h3 class="text-lg font-bold text-white mb-1">[${r.country}] ${r.data.Name}</h3>
                    <p class="text-sm text-gray-400 mb-2">Location: ${r.data.Location}</p>
                    <p class="text-sm text-gray-300"><span class="text-cyber">Mechanic:</span> ${r.data.Core_Mechanic}</p>
                `;
            } else if(r.type === 'Defense Protocol') {
                contentHTML = `
                    <h3 class="text-lg font-bold text-red-400 mb-1">🚨 [${r.country}] ${r.data.Threat || 'Security Alert'}</h3>
                    <p class="text-sm text-gray-400 mb-2">${r.data.Mechanic || r.data.Data || 'Analysis unavailable.'}</p>
                    ${r.data.Counter_Protocol ? `<p class="text-sm text-gray-300"><span class="text-green-400">Counter Protocol:</span> ${r.data.Counter_Protocol}</p>` : ''}
                `;
            } else {
                contentHTML = `
                    <h3 class="text-lg font-bold text-blue-300 mb-1">🔹 [${r.country}] ${r.type} Node</h3>
                    <p class="text-sm text-gray-300">${r.data.Data}</p>
                `;
            }

            el.innerHTML = contentHTML;
            resultsContainer.appendChild(el);
        });
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') performSearch();
    });
});
