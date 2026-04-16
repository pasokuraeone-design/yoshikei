document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const togglePricesBtn = document.getElementById('toggle-prices-btn');
    const pricesContent = document.getElementById('prices-content');
    
    // Inputs Arrays for easy access
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const sizes = [2, 3, 4];
    
    // Load saved data from localStorage
    loadData();

    // Attach event listeners to all inputs to trigger recalculation on change
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('input', () => {
            saveData();
            calculate();
        });
        el.addEventListener('change', () => {
            saveData();
            calculate();
        });
    });

    // Toggle Prices Section functionality
    let pricesOpen = false;
    togglePricesBtn.addEventListener('click', () => {
        pricesOpen = !pricesOpen;
        if(pricesOpen) {
            pricesContent.style.display = 'block';
            togglePricesBtn.textContent = '閉じる ▲';
        } else {
            pricesContent.style.display = 'none';
            togglePricesBtn.textContent = '開く ▼';
        }
    });

    // Initial calculation
    calculate();


    // --- Functions ---
    
    function loadData() {
        // Load Course Prices
        sizes.forEach(size => {
            const v5 = localStorage.getItem(`c5-${size}`);
            if(v5) document.getElementById(`c5-${size}`).value = v5;
            
            const v6 = localStorage.getItem(`c6-${size}`);
            if(v6) document.getElementById(`c6-${size}`).value = v6;
        });

        // Load Daily Prices
        days.forEach(day => {
            sizes.forEach(size => {
                const val = localStorage.getItem(`d-${day}-${size}`);
                if(val) document.getElementById(`d-${day}-${size}`).value = val;
            });
            
            // Load Persons Need
            const pVal = localStorage.getItem(`p-${day}`);
            if(pVal) document.getElementById(`p-${day}`).value = pVal;
        });
    }

    function saveData() {
        // Save Course Prices
        sizes.forEach(size => {
            localStorage.setItem(`c5-${size}`, document.getElementById(`c5-${size}`).value);
            localStorage.setItem(`c6-${size}`, document.getElementById(`c6-${size}`).value);
        });

        // Save Daily Prices
        days.forEach(day => {
            sizes.forEach(size => {
                localStorage.setItem(`d-${day}-${size}`, document.getElementById(`d-${day}-${size}`).value);
            });
            
            // Save Persons Need
            localStorage.setItem(`p-${day}`, document.getElementById(`p-${day}`).value);
        });
    }

    // Main calculation logic
    function calculate() {
        // 1. Get user needs
        const needs = {};
        days.forEach(day => {
            needs[day] = parseInt(document.getElementById(`p-${day}`).value) || 2;
        });

        // Helper to safely get prices
        const getDailyPrice = (day, size) => {
            return parseInt(document.getElementById(`d-${day}-${size}`).value) || 0;
        };
        const getCoursePrice = (days, size) => {
            return parseInt(document.getElementById(`c${days}-${size}`).value) || 0;
        };

        // Calculate Max Persons for specific periods
        const monToFriMax = Math.max(needs.mon, needs.tue, needs.wed, needs.thu, needs.fri);
        const monToSatMax = Math.max(monToFriMax, needs.sat);

        // UI updates for max sizes
        document.getElementById('res-b-max').textContent = monToFriMax;
        document.getElementById('res-c-max').textContent = monToSatMax;

        // ---- Pattern A: Daily Individual ----
        let costA = 0;
        days.forEach(day => {
            costA += getDailyPrice(day, needs[day]);
        });

        // ---- Pattern B: 5-Day Course + Sat Individual ----
        // Buy Mon-Fri 5-day course based on the maximum persons needed during those 5 days
        const c5Price = getCoursePrice(5, monToFriMax);
        const satPrice = getDailyPrice('sat', needs.sat);
        const costB = c5Price + satPrice;

        // ---- Pattern C: 6-Day Course ----
        // Buy Mon-Sat 6-day course based on the maximum persons needed
        const costC = getCoursePrice(6, monToSatMax);

        // Update Prices in UI
        updatePriceDisplay('res-a-price', costA);
        updatePriceDisplay('res-b-price', costB);
        updatePriceDisplay('res-c-price', costC);

        // Prevent comparisons if costs are 0 (e.g., initial empty state)
        if (costA === 0 && costB === 0 && costC === 0) {
            clearHighlights();
            return;
        }

        // Compare and Highlight best option
        const costs = [
            { id: 'a', cost: costA, name: '毎日バラで購入' },
            { id: 'b', cost: costB, name: '5日間コース + 土曜バラ' },
            { id: 'c', cost: costC, name: '6日間コース (月〜土)' }
        ];

        // Sort by cost to find cheapest
        costs.sort((val1, val2) => val1.cost - val2.cost);
        const minCost = costs[0].cost;
        const bestOption = costs[0];

        // Display Diffs and Highlights
        costs.forEach(option => {
            const card = document.getElementById(`card-pattern-${option.id}`);
            const diffEl = document.getElementById(`res-${option.id}-diff`);
            
            if (option.cost === minCost) {
                card.classList.add('is-best');
                diffEl.textContent = '✨ 最もお得です！';
                diffEl.className = 'pattern-diff diff-save';
            } else {
                card.classList.remove('is-best');
                const diffValue = option.cost - minCost;
                diffEl.textContent = `最安値より +${diffValue.toLocaleString()}円`;
                diffEl.className = 'pattern-diff diff-extra';
            }
        });

        // Update Recommendation Box
        const recTitle = document.getElementById('rec-title');
        const recDesc = document.getElementById('rec-desc');

        recTitle.textContent = `${bestOption.name} が最安です！`;
        
        let savingsDescription = '';
        if (costs[1].cost > minCost) {
            savingsDescription = `${costs[1].name} と比べると ${(costs[1].cost - minCost).toLocaleString()}円 お得になります。`;
        } else {
            savingsDescription = `ほかの購入方法も同額です。`; 
        }
        
        // Explain course overflow if applicable
        let overflowNote = '';
        if (bestOption.id === 'b' || bestOption.id === 'c') {
            overflowNote = `<br><small style="opacity:0.8">※コース購入は必要人数が一番多い日(${bestOption.id === 'b' ? monToFriMax : monToSatMax}人用)に合わせています。</small>`;
        }

        recDesc.innerHTML = `${savingsDescription}${overflowNote}`;
    }

    function updatePriceDisplay(elementId, amount) {
        document.getElementById(elementId).textContent = amount.toLocaleString();
    }

    function clearHighlights() {
        ['a', 'b', 'c'].forEach(id => {
            document.getElementById(`card-pattern-${id}`).classList.remove('is-best');
            document.getElementById(`res-${id}-diff`).textContent = '';
        });
        document.getElementById('rec-title').textContent = '計算中...';
        document.getElementById('rec-desc').textContent = '価格情報を入力してください。';
    }

    // Fix responsive layout Data labels 
    // Automatically add data-label for CSS media queries mobile view
    const tableHeaderCells = document.querySelectorAll('.daily-table .table-header div');
    const labels = Array.from(tableHeaderCells).map(el => el.textContent);
    
    document.querySelectorAll('.daily-table .table-row:not(.table-header)').forEach(row => {
        const cells = row.querySelectorAll('div');
        cells.forEach((cell, index) => {
            if(index > 0 && labels[index]) {
                cell.setAttribute('data-label', labels[index]);
            }
        });
    });

    const cTableHeaderCells = document.querySelectorAll('.courses-table .table-header div');
    const cLabels = Array.from(cTableHeaderCells).map(el => el.textContent);
    
    document.querySelectorAll('.courses-table .table-row:not(.table-header)').forEach(row => {
        const cells = row.querySelectorAll('div');
        cells.forEach((cell, index) => {
            if(index > 0 && cLabels[index]) {
                cell.setAttribute('data-label', cLabels[index]);
            }
        });
    });

});
