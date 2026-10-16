(() => {
    const catalog = window.SCREEN_CATALOG?.items ?? [];
    const exchangeRate = 877;
    const operatingMargin = 1.2;
    const whatsappNumber = '584242220327';
    const cart = [];
    let nextItemId = 1;
    let activeSource = '';

    const formatNumber = (value) => Number(value).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const formatUsd = (value) => `$${formatNumber(value)}`;
    const formatBs = (value) => `Bs ${formatNumber(value)}`;
    const cleanQuality = (quality) => quality.replaceAll('?', ' - ');
    const getItems = (brand, model) => catalog.filter((item) => item.brand === brand && item.model === model);
    function addToCart(item) {
        cart.push({ ...item, source: activeSource, id: nextItemId++ });
        renderCart();
    }

    function addButtonFor(block) {
        return block.querySelector('button[data-add-phone]');
    }

    function setupModelPickers() {
        const brands = [...new Set(catalog.map((item) => item.brand))]
            .sort((left, right) => left.localeCompare(right, 'es'));

        document.querySelectorAll('[data-phone-service]').forEach((block) => {
            const brandSelect = block.querySelector('[data-brand-select]');
            const modelSelect = block.querySelector('[data-model-select]');

            brands.forEach((brand) => brandSelect.add(new Option(brand, brand)));
            brandSelect.addEventListener('change', () => {
                modelSelect.replaceChildren(new Option('Selecciona un modelo', ''));
                modelSelect.disabled = !brandSelect.value;
                if (brandSelect.value) {
                    const models = [...new Set(catalog.filter((item) => item.brand === brandSelect.value).map((item) => item.model))]
                        .sort((left, right) => left.localeCompare(right, 'es', { numeric: true }));
                    models.forEach((model) => modelSelect.add(new Option(model, model)));
                }
                refreshPhoneService(block);
            });
            modelSelect.addEventListener('change', () => refreshPhoneService(block));
        });
    }

    function renderScreenOptions(block) {
        const options = block.querySelector('[data-screen-options]');
        const prompt = block.querySelector('[data-screen-prompt]');
        const addButton = addButtonFor(block);
        const items = getItems(block.querySelector('[data-brand-select]').value, block.querySelector('[data-model-select]').value);
        options.replaceChildren();
        addButton.disabled = true;
        prompt.hidden = items.length > 0;
        if (!items.length) return;

        items.forEach((item, index) => {
            const label = document.createElement('label');
            label.dataset.qualityOption = '';
            label.className = 'flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500 active:translate-y-0 active:scale-[0.98]';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'screen-quality';
            radio.value = String(index);
            radio.className = 'mt-1 accent-emerald-500';
            radio.addEventListener('change', () => {
                addButton.disabled = false;
            });
            const copy = document.createElement('span');
            copy.className = 'min-w-0 flex-1';
            const title = document.createElement('strong');
            title.className = 'block text-sm text-slate-100';
            title.textContent = cleanQuality(item.quality);
            const qualityText = item.quality.toLowerCase();
            const badge = document.createElement('span');
            badge.className = 'mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide';
            if (qualityText.includes('original')) {
                badge.classList.add('border-emerald-500/30', 'bg-emerald-500/10', 'text-emerald-300');
                badge.textContent = 'Calidad original';
            } else if (qualityText.includes('soft oled') || qualityText.includes('amoled') || qualityText.includes('oled')) {
                badge.classList.add('border-teal-400/30', 'bg-teal-400/10', 'text-teal-200');
                badge.textContent = 'Recomendado';
            } else if (qualityText.includes('incell') || qualityText.includes('tft') || qualityText.includes('ips') || qualityText.includes('lcd')) {
                badge.classList.add('border-sky-400/30', 'bg-sky-400/10', 'text-sky-200');
                badge.textContent = 'Económico';
            } else {
                badge.classList.add('border-slate-600', 'bg-slate-800/70', 'text-slate-300');
                badge.textContent = 'Disponible';
            }
            const usd = document.createElement('span');
            usd.className = 'mt-1 block text-sm font-bold text-emerald-300';
            usd.textContent = formatUsd(item.retailBs * operatingMargin);
            const bolivars = document.createElement('span');
            bolivars.className = 'mt-0.5 block text-xs text-slate-400';
            bolivars.textContent = formatBs(item.retailBs * operatingMargin * exchangeRate);
            copy.append(title, badge, usd, bolivars);
            label.append(radio, copy);
            options.append(label);
        });
    }

    function refreshPhoneService(block) {
        const kind = block.dataset.phoneService;
        const brand = block.querySelector('[data-brand-select]').value;
        const model = block.querySelector('[data-model-select]').value;
        const addButton = addButtonFor(block);
        const hasModel = Boolean(brand && model);
        addButton.disabled = !hasModel;

        if (kind === 'screen') {
            renderScreenOptions(block);
            return;
        }
        if (kind !== 'battery') return;

        const hint = block.querySelector('[data-service-hint]');
        if (!hasModel) {
            hint.textContent = 'Selecciona marca y modelo para consultar el precio estimado.';
        } else if (brand === 'iPhone' || brand === 'Google Pixel') {
            hint.textContent = `Cambio de batería para ${brand} ${model}: precio a consultar.`;
        } else {
            const highestScreen = Math.max(0, ...getItems(brand, model).map((item) => item.retailBs * operatingMargin));
            hint.textContent = highestScreen
                ? `Batería para ${brand} ${model}: ${highestScreen < 100 ? '$20' : '$40'} estimado.`
                : 'No hay precio de pantalla publicado para este modelo; batería a consultar.';
        }
    }

    function selectedPhoneModel(block) {
        const brand = block.querySelector('[data-brand-select]').value;
        const model = block.querySelector('[data-model-select]').value;
        return { brand, model, fullName: `${brand} ${model}`.trim() };
    }

    function addPhoneService(button) {
        const block = button.closest('[data-phone-service]');
        const kind = block.dataset.phoneService;
        const { brand, model, fullName } = selectedPhoneModel(block);

        if (kind === 'review') {
            addToCart({
                label: `Revisión técnica de teléfono · ${fullName}`,
                usd: 5,
                isReview: true,
                detail: 'No se cobra si realizas la reparación con nosotros'
            });
            return;
        }

        if (kind === 'screen') {
            const selected = block.querySelector('input[name="screen-quality"]:checked');
            if (!selected) return;
            const screen = getItems(brand, model)[Number(selected.value)];
            const usd = screen.retailBs * operatingMargin;
            addToCart({
                label: `Pantalla ${fullName} · ${cleanQuality(screen.quality)}`,
                usd
            });
            return;
        }

        if (kind === 'battery') {
            if (brand === 'iPhone' || brand === 'Google Pixel') {
                addToCart({ label: `Cambio de batería ${fullName}`, consult: true });
                return;
            }
            const highestScreen = Math.max(0, ...getItems(brand, model).map((item) => item.retailBs * operatingMargin));
            if (!highestScreen) {
                addToCart({ label: `Cambio de batería ${fullName}`, consult: true, detail: 'Modelo sin precio de pantalla en la lista' });
                return;
            }
            const usd = highestScreen < 100 ? 20 : 40;
            addToCart({ label: `Cambio de batería ${fullName}`, usd, detail: 'Precio estimado; sujeto a cambios' });
            return;
        }

        if (kind === 'port') {
            addToCart({ label: `Pin de carga / conector USB · ${fullName}`, consult: true });
            return;
        }

        if (kind === 'water') {
            const premium = block.querySelector('[data-water-tier]').value === 'premium';
            const usd = premium ? 40 : 20;
            addToCart({
                label: `Limpieza química y desoxidación · ${fullName}`,
                usd,
                detail: `${premium ? 'Gama alta (más de $200)' : 'Equipo estándar'} · sin garantía en componentes internos`
            });
            return;
        }

        if (kind === 'flex') {
            if (brand === 'iPhone' || brand === 'Google Pixel') {
                addToCart({ label: `Botones flex / bandeja SIM · ${fullName}`, consult: true });
                return;
            }
            const usd = 12;
            addToCart({ label: `Botones flex / bandeja SIM · ${fullName}`, usd, detail: 'Tarifa sujeta a cambios' });
        }
    }

    const pcServices = {
        review: { label: 'Revisión técnica de laptop o PC', usd: 5, isReview: true, detail: 'No se cobra si realizas la reparación con nosotros' },
        maintenance: { label: 'Mantenimiento preventivo completo', usd: 36, detail: 'Limpieza interna completa y pasta térmica' },
        format: { label: 'Formateo e instalación de sistema operativo', usd: 18 },
        optimization: { label: 'Optimización de equipo lento / virus', usd: 12, detail: 'Proceso de hasta 1 hora' },
        jack: { label: 'Reparación o cambio de jack de poder', consult: true },
        'ssd-hardware': { label: 'SSD físico', consult: true, detail: 'Precio del componente a consultar' }
    };

    function addPcService(kind) {
        const service = pcServices[kind];
        if (service) {
            addToCart({ ...service });
            return;
        }
        if (kind === 'ssd') {
            const mode = document.querySelector('input[name="ssd-mode"]:checked').value;
            const usd = mode === 'clone' ? 30 : 18;
            addToCart({
                label: 'Instalación de disco sólido (SSD)',
                usd,
                detail: mode === 'clone' ? 'Instalación con clonación' : 'Instalación de sistema'
            });
        }
    }

    function addHomeVisit() {
        const zone = document.querySelector('#visit-location').value;
        const visits = {
            ocumare: { label: 'Revisión a domicilio · Ocumare del Tuy', fixedBs: 1000, isVisit: true, detail: 'Pago por adelantado · ciertas zonas aplican condiciones' },
            charallave: { label: 'Revisión a domicilio · Charallave', fixedBs: 1500, isVisit: true, detail: 'Pago por adelantado' },
            other: { label: 'Revisión a domicilio · otra zona', consult: true, isVisit: true }
        };
        if (visits[zone]) addToCart(visits[zone]);
    }

    function setupDeviceTabs() {
        const tabs = [...document.querySelectorAll('[data-device-tab]')];
        const panels = [...document.querySelectorAll('[data-device-panel]')];

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                const selectedDevice = tab.dataset.deviceTab;
                tabs.forEach((item) => {
                    const selected = item === tab;
                    item.setAttribute('aria-selected', String(selected));
                    item.classList.toggle('text-emerald-300', selected);
                    item.classList.toggle('text-slate-400', !selected);
                });
                panels.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.devicePanel !== selectedDevice));
            });
        });
    }

    function setupSummaryToggle() {
        const summary = document.querySelector('#quote-summary');
        const toggle = document.querySelector('#quote-details-toggle');
        const label = toggle.querySelector('[data-summary-toggle-label]');
        const icon = toggle.querySelector('[data-lucide="chevron-up"]');

        toggle.addEventListener('click', () => {
            const expanded = summary.classList.toggle('is-expanded');
            toggle.setAttribute('aria-expanded', String(expanded));
            label.textContent = expanded ? 'Ocultar desglose' : 'Ver desglose';
            icon.classList.toggle('rotate-180', expanded);
        });
    }

    function renderCart() {
        const list = document.querySelector('#quote-lines');
        const empty = document.querySelector('#quote-empty');
        const count = document.querySelector('#quote-item-count');
        const summary = document.querySelector('#quote-summary');
        const detailsToggle = document.querySelector('#quote-details-toggle');
        const itemUsd = (item) => item.usd || 0;
        const totalUsd = cart.reduce((sum, item) => sum + itemUsd(item) + ((item.fixedBs || 0) / exchangeRate), 0);
        const totalBs = cart.reduce((sum, item) => sum + (itemUsd(item) * exchangeRate) + (item.fixedBs || 0), 0);
        const hasPricedItems = cart.some((item) => itemUsd(item) > 0 || item.fixedBs > 0);
        const cotizador = document.querySelector('#cotizador');
        cotizador.classList.toggle('has-cart', cart.length > 0);
        document.querySelectorAll('[data-phone-service]').forEach((card) => {
            card.classList.toggle('is-in-cart', cart.some((item) => item.source === `phone:${card.dataset.phoneService}`));
        });
        document.querySelectorAll('[data-add-pc]').forEach((button) => {
            const card = button.closest('article');
            card.classList.toggle('is-in-cart', cart.some((item) => item.source === `pc:${button.dataset.addPc}`));
        });
        document.querySelector('[aria-labelledby="home-visit-title"]')
            .classList.toggle('is-in-cart', cart.some((item) => item.source === 'home-visit'));

        list.replaceChildren();
        empty.classList.toggle('hidden', cart.length > 0);
        count.textContent = `${cart.length} ${cart.length === 1 ? 'servicio agregado' : 'servicios agregados'}`;
        if (cart.length === 0) {
            summary.classList.remove('is-expanded');
            detailsToggle.setAttribute('aria-expanded', 'false');
            detailsToggle.querySelector('[data-summary-toggle-label]').textContent = 'Ver desglose';
            detailsToggle.querySelector('[data-lucide="chevron-up"]').classList.remove('rotate-180');
        }

        cart.forEach((item) => {
            const row = document.createElement('li');
            row.className = 'flex items-start justify-between gap-3 border-b border-slate-800 pb-3';
            const detail = document.createElement('span');
            detail.className = 'min-w-0 text-sm font-semibold text-slate-200';
            detail.textContent = item.label;
            if (item.detail) {
                const note = document.createElement('small');
                note.className = 'mt-1 block text-xs font-normal leading-5 text-slate-500';
                note.textContent = item.detail;
                detail.append(note);
            }
            const controls = document.createElement('span');
            controls.className = 'flex shrink-0 items-start gap-2';
            const price = document.createElement('strong');
            price.className = 'text-right text-sm text-emerald-300';
            price.textContent = item.consult
                ? 'A consultar'
                : item.fixedBs
                    ? `${formatUsd(item.fixedBs / exchangeRate)} · ${formatBs(item.fixedBs)}`
                    : `${formatUsd(itemUsd(item))} · ${formatBs(itemUsd(item) * exchangeRate)}`;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.dataset.removeItem = String(item.id);
            remove.setAttribute('aria-label', `Quitar ${item.label} de la cotización`);
            remove.className = 'rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400';
            remove.innerHTML = '<i data-lucide="trash-2" class="h-4 w-4"></i>';
            controls.append(price, remove);
            row.append(detail, controls);
            list.append(row);
        });

        const totalUsdElement = document.querySelector('#quote-total-usd');
        const totalBsElement = document.querySelector('#quote-total-bs');
        totalUsdElement.textContent = hasPricedItems ? formatUsd(totalUsd) : cart.some((item) => item.consult) ? 'A consultar' : formatUsd(0);
        totalBsElement.textContent = hasPricedItems
            ? `${formatBs(totalBs)} · tasa fija 877 Bs/USD`
            : cart.some((item) => item.consult)
                ? 'Pendiente de diagnóstico'
                : 'Bs 0,00 · tasa fija 877 Bs/USD';
        document.querySelector('#quote-exclusions').textContent = cart.some((item) => item.consult)
            ? 'Los conceptos “a consultar” no están incluidos en el total estimado.'
            : 'Estimado referencial; la cotización final depende del diagnóstico.';
        const whatsapp = document.querySelector('#quote-whatsapp');
        const enabled = cart.length > 0;
        whatsapp.setAttribute('aria-disabled', String(!enabled));
        whatsapp.href = enabled ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildMessage(totalUsd, totalBs, hasPricedItems))}` : '#cotizador';
        document.querySelector('#quote-summary').classList.toggle('is-mobile-visible', enabled && window.matchMedia('(max-width: 1023px)').matches);
        flashPrice(totalUsdElement);
        flashPrice(totalBsElement);
        if (window.lucide) window.lucide.createIcons({ nodes: [...list.querySelectorAll('[data-lucide]')] });
    }

    function flashPrice(element) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        element.classList.remove('quote-price-change');
        void element.offsetWidth;
        element.classList.add('quote-price-change');
    }

    function buildMessage(totalUsd, totalBs, hasPricedItems) {
        const message = ['Hola, quisiera solicitar esta cotización de reparación:', ''];
        cart.forEach((item) => {
            const price = item.consult
                ? 'Precio a consultar'
                : item.fixedBs
                    ? `${formatBs(item.fixedBs)} (${formatUsd(item.fixedBs / exchangeRate)})`
                    : `${formatUsd(item.usd || 0)} (${formatBs((item.usd || 0) * exchangeRate)})`;
            message.push(`• ${item.label}: ${price}${item.detail ? ` — ${item.detail}` : ''}`);
        });
        message.push('', hasPricedItems
            ? `Total estimado: ${formatUsd(totalUsd)} / ${formatBs(totalBs)} (tasa fija 877 Bs/USD)`
            : 'Total: pendiente de cotización y diagnóstico.');
        message.push('', 'Entiendo que los precios son referenciales y sujetos a diagnóstico.');
        return message.join('\n');
    }

    setupDeviceTabs();
    setupModelPickers();
    setupSummaryToggle();
    document.querySelectorAll('[data-add-phone]').forEach((button) => button.addEventListener('click', () => {
        activeSource = `phone:${button.closest('[data-phone-service]').dataset.phoneService}`;
        addPhoneService(button);
        activeSource = '';
    }));
    document.querySelectorAll('[data-add-pc]').forEach((button) => button.addEventListener('click', () => {
        activeSource = `pc:${button.dataset.addPc}`;
        addPcService(button.dataset.addPc);
        activeSource = '';
    }));
    document.querySelector('#add-home-visit').addEventListener('click', () => {
        activeSource = 'home-visit';
        addHomeVisit();
        activeSource = '';
    });
    document.querySelector('#visit-location').addEventListener('change', (event) => {
        document.querySelector('#add-home-visit').disabled = !event.target.value;
    });
    document.querySelector('#quote-lines').addEventListener('click', (event) => {
        const removeButton = event.target.closest('[data-remove-item]');
        if (!removeButton) return;
        const index = cart.findIndex((item) => item.id === Number(removeButton.dataset.removeItem));
        if (index !== -1) cart.splice(index, 1);
        renderCart();
    });
    document.querySelector('#quote-whatsapp').addEventListener('click', (event) => {
        if (cart.length === 0) event.preventDefault();
    });
    window.addEventListener('resize', renderCart);
    renderCart();
})();