( function () {
	function qs( root, sel ) { return root.querySelector( sel ); }
	function qsa( root, sel ) { return Array.prototype.slice.call( root.querySelectorAll( sel ) ); }
	function formatCurrency( value ) {
		try {
			// Format as decimal number, then add $ at the beginning
			const formatted = new Intl.NumberFormat( undefined, { style: 'decimal', maximumFractionDigits: 0 } ).format( Math.round( value ) );
			return '$' + formatted;
		} catch ( e ) {
			return '$' + Math.round( value ).toLocaleString();
		}
	}
	async function fetchConfig() {
		try {
			const res = await fetch( '/wp-json/atera/v1/calc-sliders', { credentials: 'same-origin' } );
			if ( ! res.ok ) {
				console.warn( 'Atera Calculator: Failed to load sliders config, using defaults' );
				return { sliders: [ {}, {}, {} ] };
			}
			return res.json();
		} catch ( e ) {
			console.warn( 'Atera Calculator: Error fetching config, using defaults', e );
			return { sliders: [ {}, {}, {} ] };
		}
	}
	function createTicks( ticks ) {
		const row = document.createElement( 'div' );
		row.className = 'atera-cc__ticks';
		if ( Array.isArray( ticks ) && ticks.length ) {
			ticks.forEach( function ( t ) {
				const span = document.createElement( 'span' );
				span.className = 'atera-cc__tick';
				span.textContent = String( t );
				row.appendChild( span );
			} );
		}
		return row;
	}
	function createSlider( label, cfg, onChange ) {
		const wrap = document.createElement( 'div' );
		wrap.className = 'atera-cc__slider';
		const id = 'slider-' + Math.random().toString( 36 ).slice( 2 );
		const labelEl = document.createElement( 'label' );
		labelEl.className = 'atera-cc__slider-label';
		labelEl.setAttribute( 'for', id );
		labelEl.textContent = label;
		const valueEl = document.createElement( 'div' );
		valueEl.className = 'atera-cc__slider-value';
		const input = document.createElement( 'input' );
		input.type = 'range';
		input.id = id;
		input.className = 'atera-cc__range';
		input.min = cfg.min;
		input.max = cfg.max;
		input.step = cfg.step || 1;
		input.value = cfg.default ?? cfg.min;
		function updateSliderColor() {
			const min = Number( input.min ) || 0;
			const max = Number( input.max ) || 100;
			const value = Number( input.value ) || min;
			const percentage = ( ( value - min ) / ( max - min ) ) * 100;
			// Set background gradient: #D1AD78 for active part, #E5E5E5 for inactive part
			input.style.background = 'linear-gradient(to right, #D1AD78 0%, #D1AD78 ' + percentage + '%, #E5E5E5 ' + percentage + '%, #E5E5E5 100%)';
		}
		function update() {
			valueEl.textContent = cfg.format === 'currency' ? formatCurrency( Number( input.value ) ) : String( input.value );
			updateSliderColor();
			onChange( Number( input.value ) );
		}
		input.addEventListener( 'input', update );
		update();
		wrap.appendChild( labelEl );
		wrap.appendChild( valueEl );
		wrap.appendChild( input );
		if ( Array.isArray( cfg.ticks ) && cfg.ticks.length ) {
			wrap.appendChild( createTicks( cfg.ticks ) );
		}
		return { el: wrap, get value() { return Number( input.value ); }, set value( v ) { input.value = v; } };
	}
	function computeFromRules( values ) {
		// Based on spec:
		// T = Number of technicians (slider 1)
		// E = Number of endpoints   (slider 2)
		// P = Price per endpoint per month (slider 3)
		// Atera (annual) = T × 1500
		// Current provider (annual) = E × P × 12
		// Savings = Current provider − Atera
		const T = values[ 0 ] || 0;
		const E = values[ 1 ] || 0;
		const P = values[ 2 ] || 0;
		const atera = T * 1500;
		const provider = E * P * 12;
		const savings = Math.max( provider - atera, 0 );
		return { atera, provider, savings };
	}
	async function enhance( root ) {
		// Prevent concurrent execution
		if ( root.dataset.ateraEnhancing === 'true' ) {
			return;
		}
		root.dataset.ateraEnhancing = 'true';
		
		try {
			let attrs = {};
			try {
				attrs = JSON.parse( root.getAttribute( 'data-attrs' ) || '{}' );
			} catch ( e ) {}
		
		// Always clear sliders first to prevent duplicates
		const slidersWrap = qs( root, '.atera-cc__sliders' );
		if ( slidersWrap ) {
			// Double-check: count existing sliders before clearing
			const existingSliders = slidersWrap.querySelectorAll( '.atera-cc__slider' );
			if ( existingSliders.length > 0 ) {
				slidersWrap.innerHTML = '';
			}
		}
		
		// Mark as enhanced
		root.dataset.ateraEnhanced = 'true';
		const headlineEl = qs( root, '.atera-cc__headline' );
		const headlineSubEl = qs( root, '.atera-cc__headline-sub' );
		const panelTitleEl = qs( root, '.atera-cc__panel-title' );
		const saveLabelEl = qs( root, '.atera-cc__save-label' );
		const saveValueEl = qs( root, '.atera-cc__save-value' );
		const saveSubEl = qs( root, '.atera-cc__save-sub' );
		const ctaEl = qs( root, '.atera-cc__cta' );
		const ctaNoteEl = qs( root, '.atera-cc__cta-note' );
		const costsTitleEl = qs( root, '.atera-cc__costs-title' );
		const costsAteraNameEl = qs( root, '.atera-cc__costs-name--atera' );
		const costsAteraValEl = qs( root, '.atera-cc__costs-val--atera' );
		const costsProvNameEl = qs( root, '.atera-cc__costs-name--provider' );
		const costsProvValEl = qs( root, '.atera-cc__costs-val--provider' );
		const footnoteEl = qs( root, '.atera-cc__footnote' );

		if ( headlineEl ) {
			const titleText = attrs.title || 'Calculate how much you save with Atera';
			// Split title to put "Atera" on a new line
			const parts = titleText.split(/\s+Atera\s*$/i);
			if ( parts.length > 1 && parts[0] ) {
				// If "Atera" is at the end, put it on a new line
				headlineEl.innerHTML = parts[0].trim() + ' <br><span class="atera-cc__headline-brand">Atera</span>';
			} else {
				// Fallback: try to find "Atera" anywhere and move it to new line
				const match = titleText.match(/^(.+?)\s+(Atera)$/i);
				if ( match ) {
					headlineEl.innerHTML = match[1].trim() + ' <br><span class="atera-cc__headline-brand">' + match[2] + '</span>';
				} else {
					headlineEl.textContent = titleText;
				}
			}
		}
		if ( headlineSubEl ) {
			if ( attrs.subtitle ) {
				headlineSubEl.hidden = false;
				headlineSubEl.textContent = attrs.subtitle;
			} else {
				headlineSubEl.hidden = true;
			}
		}
		if ( panelTitleEl ) {
			panelTitleEl.textContent = attrs.panelTitle || 'Adjust the scales below to see your savings:';
			// Apply styling
			if ( attrs.panelTitleFontSize ) {
				panelTitleEl.style.fontSize = attrs.panelTitleFontSize + 'px';
			}
			if ( attrs.panelTitleColor ) {
				panelTitleEl.style.color = attrs.panelTitleColor;
			}
			if ( attrs.panelTitleBold ) {
				panelTitleEl.style.fontWeight = 'bold';
			} else {
				panelTitleEl.style.fontWeight = '';
			}
		}
		if ( saveLabelEl ) saveLabelEl.textContent = attrs.resultTitle || attrs.saveLabel || 'You save';
		if ( saveSubEl ) saveSubEl.textContent = attrs.saveSub || 'annually — estimated based on Atera\'s Pro Plan';
		if ( ctaEl ) {
			ctaEl.textContent = attrs.ctaText || 'Start free trial';
			// Convert button to link if URL is provided
			if ( attrs.ctaUrl && attrs.ctaUrl.trim() ) {
				if ( ctaEl.tagName === 'BUTTON' ) {
					const linkEl = document.createElement( 'a' );
					linkEl.className = ctaEl.className;
					linkEl.href = attrs.ctaUrl.trim();
					linkEl.textContent = ctaEl.textContent;
					linkEl.setAttribute( 'role', 'button' );
					ctaEl.parentNode.replaceChild( linkEl, ctaEl );
				} else if ( ctaEl.tagName === 'A' ) {
					ctaEl.href = attrs.ctaUrl.trim();
				}
			} else {
				// Convert link back to button if URL is removed
				if ( ctaEl.tagName === 'A' ) {
					const buttonEl = document.createElement( 'button' );
					buttonEl.className = ctaEl.className;
					buttonEl.type = 'button';
					buttonEl.textContent = ctaEl.textContent;
					ctaEl.parentNode.replaceChild( buttonEl, ctaEl );
				}
			}
			
			// Handle email submission
			const emailInput = qs( root, '.atera-cc__email' );
			const thankYouMsg = qs( root, '.atera-cc__thank-you' );
			const emailWrapper = qs( root, '.atera-cc__email-wrapper' );
			
			if ( ctaEl && emailInput && thankYouMsg && emailWrapper ) {
				// Get the final CTA element (might have been replaced)
				const finalCtaEl = qs( root, '.atera-cc__cta' );
				if ( finalCtaEl ) {
					finalCtaEl.addEventListener( 'click', function( e ) {
						// If it's a link, always allow navigation (don't require email)
						if ( finalCtaEl.tagName === 'A' ) {
							const email = emailInput.value.trim();
							// If email is provided and valid, show thank you message before navigation
							if ( email && emailInput.validity.valid ) {
								emailInput.style.display = 'none';
								thankYouMsg.style.display = 'block';
							}
							// Allow link navigation to proceed
							return true;
						}
						
						// For buttons, require email validation
						const email = emailInput.value.trim();
						if ( email && emailInput.validity.valid ) {
							// Hide input, show thank you message
							emailInput.style.display = 'none';
							thankYouMsg.style.display = 'block';
							e.preventDefault();
						} else if ( ! email ) {
							e.preventDefault();
							emailInput.focus();
						} else {
							// Invalid email
							e.preventDefault();
							emailInput.focus();
						}
					} );
				}
			}
		}
		if ( ctaNoteEl ) ctaNoteEl.textContent = attrs.ctaNote || 'No credit card required';
		if ( costsTitleEl ) costsTitleEl.textContent = attrs.costsTitle || 'Average annual cost';
		if ( costsAteraNameEl ) costsAteraNameEl.textContent = attrs.costsAteraName || 'Atera';
		if ( costsProvNameEl ) costsProvNameEl.textContent = attrs.costsProviderName || 'Current provider';
		if ( footnoteEl ) {
			if ( attrs.resultDescription || attrs.footnote ) {
				footnoteEl.hidden = false;
				footnoteEl.textContent = attrs.resultDescription || attrs.footnote || '';
			} else {
				footnoteEl.hidden = true;
			}
		}

		const config = await fetchConfig();
		const sliders = [];
		const labels = [ attrs.slider1Label || 'How many technicians are in your company?', attrs.slider2Label || 'How many endpoints do you manage?', attrs.slider3Label || 'How much are you charged per endpoint per month?' ];
		const cfgs = ( config && config.sliders ) ? config.sliders : [ {}, {}, {} ];
		const showSliders = [ attrs.showSlider1 !== false, attrs.showSlider2 !== false, attrs.showSlider3 !== false ];

		function updateResult() {
			const values = sliders.map( s => s.value );
			const result = computeFromRules( values );
			if ( saveValueEl ) saveValueEl.textContent = formatCurrency( result.savings );
			if ( costsAteraValEl ) costsAteraValEl.textContent = formatCurrency( result.atera );
			if ( costsProvValEl ) costsProvValEl.textContent = formatCurrency( result.provider );
		}

		// Check if sliders already exist - if so, update labels instead of recreating
		const existingSliders = slidersWrap ? slidersWrap.querySelectorAll( '.atera-cc__slider' ) : [];
		let shouldRecreate = false;
		
		// Check if we need to recreate sliders (different count or visibility)
		if ( existingSliders.length > 0 ) {
			let visibleCount = 0;
			showSliders.forEach( function( show ) { if ( show ) visibleCount++; } );
			if ( existingSliders.length !== visibleCount ) {
				shouldRecreate = true;
			} else {
				// Update existing slider labels
				let sliderIndex = 0;
				for ( let i = 0; i < 3; i++ ) {
					if ( ! showSliders[ i ] ) continue;
					if ( sliderIndex < existingSliders.length ) {
						const labelEl = existingSliders[ sliderIndex ].querySelector( '.atera-cc__slider-label' );
						if ( labelEl && labelEl.textContent !== labels[ i ] ) {
							labelEl.textContent = labels[ i ];
						}
						sliderIndex++;
					}
				}
			}
		} else {
			shouldRecreate = true;
		}

		// Recreate sliders if needed
		if ( shouldRecreate && slidersWrap ) {
			slidersWrap.innerHTML = '';
			
			for ( let i = 0; i < 3; i++ ) {
				if ( ! showSliders[ i ] ) continue;
				const slider = createSlider( labels[ i ], cfgs[ i ] || { min: 0, max: 100, step: 1, default: 0 }, updateResult );
				sliders.push( slider );
				slidersWrap.appendChild( slider.el );
			}
			updateResult();
		} else if ( existingSliders.length > 0 ) {
			// Rebuild sliders array from existing DOM elements for updateResult to work
			for ( let i = 0; i < existingSliders.length; i++ ) {
				const input = existingSliders[ i ].querySelector( '.atera-cc__range' );
				if ( input ) {
					sliders.push( {
						get value() { return Number( input.value ); },
						set value( v ) { input.value = v; }
					} );
				}
			}
			updateResult();
		}
		
		// Mark as complete
		root.dataset.ateraEnhancing = 'false';
		root.dataset.ateraLastAttrs = root.getAttribute( 'data-attrs' ) || '{}';
		} catch ( e ) {
			// On error, clear lock
			root.dataset.ateraEnhancing = 'false';
			console.error( 'Atera Calculator enhance error:', e );
		}
	}
	function isEditor() {
		return ( document.body && document.body.classList.contains( 'block-editor-page' ) ) ||
		       ( window.wp && window.wp.blockEditor ) ||
		       ( document.querySelector( '.block-editor-page' ) !== null );
	}
	
	function init() {
		// Only run on frontend, not in editor
		if ( isEditor() ) {
			return;
		}
		qsa( document, '.atera-compact-calculator' ).forEach( function ( root ) {
			enhance( root ).catch( function ( err ) {
				console.error( 'Atera Calculator init error:', err );
			} );
		} );
	}
	// Expose enhance function globally for editor use
	window.ateraCCEnhance = function ( root ) {
		if ( root ) {
			// Clear enhanced flag to force re-initialization
			root.dataset.ateraEnhanced = 'false';
			root.dataset.ateraEnhancing = 'false';
			enhance( root ).catch( function ( err ) {
				console.error( 'Atera Calculator enhance error:', err );
			} );
		} else {
			init();
		}
	};
	window.ateraCCInit = init;
	// Only auto-init on frontend
	if ( ! isEditor() ) {
		if ( document.readyState === 'complete' || document.readyState === 'interactive' ) {
			init();
		} else {
			document.addEventListener( 'DOMContentLoaded', init );
		}
	}
} )();


