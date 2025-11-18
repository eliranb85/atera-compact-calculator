( function ( wp ) {
	const { __ } = wp.i18n;
	const { useState, useEffect, useMemo, useRef } = wp.element;
	const { InspectorControls, useBlockProps } = wp.blockEditor || wp.editor;
	const { PanelBody, TextControl, RangeControl, ColorPicker, ToggleControl } = wp.components;

	wp.blocks.registerBlockType( 'atera/compact-calculator', {
		edit: ( { attributes, setAttributes, clientId } ) => {
			const blockProps = useBlockProps( { className: 'atera-compact-calculator' } );
			const [ local, setLocal ] = useState( attributes );
			const calculatorRef = useRef( null );

			const update = ( key, value ) => {
				const next = { ...local, [ key ]: value };
				setLocal( next );
				setAttributes( { [ key ]: value } );
			};

			// Function to update the calculator in the editor
			const updateCalculator = function( rootElement ) {
				if ( ! rootElement ) {
					// Fallback: try to find by clientId or use the first one
					const blockWrapper = document.querySelector( `[data-block="${clientId}"]` );
					if ( blockWrapper ) {
						rootElement = blockWrapper.querySelector( '.atera-compact-calculator' );
					}
					if ( ! rootElement ) {
						// Last resort: find the first calculator in the editor
						const calculators = document.querySelectorAll( '.atera-compact-calculator' );
						if ( calculators.length > 0 ) {
							rootElement = calculators[ 0 ];
						}
					}
				}
				
				if ( ! rootElement ) {
					return;
				}
				
				// Update attributes first
				const attrs = JSON.stringify( local );
				rootElement.setAttribute( 'data-attrs', attrs );
				rootElement.setAttribute( 'data-show-email-desktop', ( local.showEmailFieldDesktop !== false ) ? 'true' : 'false' );
				rootElement.setAttribute( 'data-show-email-mobile', ( local.showEmailFieldMobile !== false ) ? 'true' : 'false' );
				rootElement.dataset.ateraEnhanced = 'false';
				rootElement.dataset.ateraEnhancing = 'false';
				
				// Re-run enhance for the calculator
				if ( typeof window.ateraCCEnhance === 'function' ) {
					// Use setTimeout to ensure DOM is updated
					setTimeout( function() {
						rootElement.dataset.ateraEnhancing = 'false';
						window.ateraCCEnhance( rootElement );
					}, 0 );
				}
			};

			// Create a memoized string representation of local to track changes
			const localString = useMemo( function() {
				return JSON.stringify( local );
			}, [ 
				local.title, 
				local.subtitle, 
				local.slider1Label, 
				local.slider2Label, 
				local.slider3Label, 
				local.ctaText, 
				local.ctaUrl, 
				local.ctaNote,
				local.resultTitle, 
				local.resultDescription,
				local.panelTitle,
				local.panelTitleFontSize,
				local.panelTitleColor,
				local.panelTitleBold,
				local.showSlider1, 
				local.showSlider2, 
				local.showSlider3,
				local.showEmailFieldDesktop,
				local.showEmailFieldMobile
			] );

			// Trigger view.js re-initialization when attributes change
			useEffect( function () {
				// Use requestAnimationFrame to ensure DOM is ready
				const rafId = requestAnimationFrame( function() {
					if ( calculatorRef.current ) {
						updateCalculator( calculatorRef.current );
					}
				} );
				
				return function () {
					cancelAnimationFrame( rafId );
				};
			}, [ localString ] );

			// Also update when component first mounts
			useEffect( function() {
				const timeoutId = setTimeout( function() {
					if ( calculatorRef.current ) {
						updateCalculator( calculatorRef.current );
					}
				}, 200 );
				return function() {
					clearTimeout( timeoutId );
				};
			}, [] );

			// Build the same HTML structure as frontend
			const attrsJson = JSON.stringify( local );

			return (
				wp.element.createElement(
					'div',
					blockProps,
					wp.element.createElement(
						InspectorControls,
						null,
						wp.element.createElement(
							PanelBody,
							{ title: __( 'Texts', 'atera-compact-calculator' ), initialOpen: true },
							wp.element.createElement( TextControl, {
								label: __( 'Title', 'atera-compact-calculator' ),
								value: local.title || '',
								onChange: ( v ) => update( 'title', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Subtitle', 'atera-compact-calculator' ),
								value: local.subtitle || '',
								onChange: ( v ) => update( 'subtitle', v ),
							} ),
							wp.element.createElement( ToggleControl, {
								label: __( 'Show Slider 1', 'atera-compact-calculator' ),
								checked: local.showSlider1 !== false,
								onChange: ( v ) => update( 'showSlider1', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Slider 1 Label', 'atera-compact-calculator' ),
								value: local.slider1Label || '',
								onChange: ( v ) => update( 'slider1Label', v ),
								disabled: local.showSlider1 === false,
							} ),
							wp.element.createElement( ToggleControl, {
								label: __( 'Show Slider 2', 'atera-compact-calculator' ),
								checked: local.showSlider2 !== false,
								onChange: ( v ) => update( 'showSlider2', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Slider 2 Label', 'atera-compact-calculator' ),
								value: local.slider2Label || '',
								onChange: ( v ) => update( 'slider2Label', v ),
								disabled: local.showSlider2 === false,
							} ),
							wp.element.createElement( ToggleControl, {
								label: __( 'Show Slider 3', 'atera-compact-calculator' ),
								checked: local.showSlider3 !== false,
								onChange: ( v ) => update( 'showSlider3', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Slider 3 Label', 'atera-compact-calculator' ),
								value: local.slider3Label || '',
								onChange: ( v ) => update( 'slider3Label', v ),
								disabled: local.showSlider3 === false,
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Button Text', 'atera-compact-calculator' ),
								value: local.ctaText || '',
								onChange: ( v ) => update( 'ctaText', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Button Link URL', 'atera-compact-calculator' ),
								value: local.ctaUrl || '',
								onChange: ( v ) => update( 'ctaUrl', v ),
								help: __( 'Enter the URL for the button link (e.g., https://example.com)', 'atera-compact-calculator' ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Button Note Text', 'atera-compact-calculator' ),
								value: local.ctaNote || '',
								onChange: ( v ) => update( 'ctaNote', v ),
								help: __( 'Text shown below the button (e.g., "No credit card required")', 'atera-compact-calculator' ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Result Title', 'atera-compact-calculator' ),
								value: local.resultTitle || '',
								onChange: ( v ) => update( 'resultTitle', v ),
							} ),
							wp.element.createElement( TextControl, {
								label: __( 'Result Description', 'atera-compact-calculator' ),
								value: local.resultDescription || '',
								onChange: ( v ) => update( 'resultDescription', v ),
							} )
						),
						wp.element.createElement(
							PanelBody,
							{ title: __( 'Panel Title Styling', 'atera-compact-calculator' ), initialOpen: false },
							wp.element.createElement( TextControl, {
								label: __( 'Panel Title Text', 'atera-compact-calculator' ),
								value: local.panelTitle || '',
								onChange: ( v ) => update( 'panelTitle', v ),
								help: __( 'Text shown above the sliders', 'atera-compact-calculator' ),
							} ),
							wp.element.createElement( RangeControl, {
								label: __( 'Font Size (px)', 'atera-compact-calculator' ),
								value: local.panelTitleFontSize || 12,
								onChange: ( v ) => update( 'panelTitleFontSize', v ),
								min: 8,
								max: 24,
								step: 1,
							} ),
							wp.element.createElement( 'div', { style: { marginBottom: '12px' } },
								wp.element.createElement( 'label', { style: { display: 'block', marginBottom: '4px', fontWeight: 600 } }, __( 'Text Color', 'atera-compact-calculator' ) ),
								wp.element.createElement( ColorPicker, {
									color: local.panelTitleColor || '#475569',
									onChangeComplete: ( color ) => update( 'panelTitleColor', color.hex ),
								} )
							),
							wp.element.createElement( ToggleControl, {
								label: __( 'Bold', 'atera-compact-calculator' ),
								checked: local.panelTitleBold || false,
								onChange: ( v ) => update( 'panelTitleBold', v ),
							} )
						),
						wp.element.createElement(
							PanelBody,
							{ title: __( 'Email Field Visibility', 'atera-compact-calculator' ), initialOpen: false },
							wp.element.createElement( ToggleControl, {
								label: __( 'Show Email Field on Desktop', 'atera-compact-calculator' ),
								checked: local.showEmailFieldDesktop !== false,
								onChange: ( v ) => update( 'showEmailFieldDesktop', v ),
								help: __( 'Display the email input field on desktop screens (1024px and above)', 'atera-compact-calculator' ),
							} ),
							wp.element.createElement( ToggleControl, {
								label: __( 'Show Email Field on Mobile', 'atera-compact-calculator' ),
								checked: local.showEmailFieldMobile !== false,
								onChange: ( v ) => update( 'showEmailFieldMobile', v ),
								help: __( 'Display the email input field on mobile screens (below 1024px)', 'atera-compact-calculator' ),
							} )
						)
					),
					wp.element.createElement(
						'div',
						{
							ref: calculatorRef,
							className: 'atera-compact-calculator',
							'data-attrs': attrsJson,
							'data-show-email-desktop': ( local.showEmailFieldDesktop !== false ) ? 'true' : 'false',
							'data-show-email-mobile': ( local.showEmailFieldMobile !== false ) ? 'true' : 'false',
						},
						wp.element.createElement(
							'div',
							{ className: 'atera-cc atera-cc__grid', 'aria-live': 'polite' },
							wp.element.createElement(
								'div',
								{ className: 'atera-cc__intro' },
								wp.element.createElement(
									'h2',
									{ className: 'atera-cc__headline' },
									(function() {
										const titleText = local.title || __( 'Estimate your annual savings', 'atera-compact-calculator' );
										// Split title to put "Atera" on a new line
										const parts = titleText.split(/\s+Atera\s*$/i);
										if ( parts.length > 1 && parts[0] ) {
											return [
												parts[0].trim() + ' ',
												wp.element.createElement( 'br', { key: 'br' } ),
												wp.element.createElement( 'span', { key: 'brand', className: 'atera-cc__headline-brand' }, 'Atera' )
											];
										} else {
											const match = titleText.match(/^(.+?)\s+(Atera)$/i);
											if ( match ) {
												return [
													match[1].trim() + ' ',
													wp.element.createElement( 'br', { key: 'br' } ),
													wp.element.createElement( 'span', { key: 'brand', className: 'atera-cc__headline-brand' }, match[2] )
												];
											}
											return titleText;
										}
									})()
								),
								wp.element.createElement( 'p', { className: 'atera-cc__headline-sub', hidden: !local.subtitle }, local.subtitle || '' )
							),
							wp.element.createElement(
								'div',
								{ className: 'atera-cc__panel atera-cc__panel--calc', role: 'group', 'aria-label': __( 'Calculator sliders', 'atera-compact-calculator' ) },
								wp.element.createElement(
									'div',
									{ className: 'atera-cc__panel-header' },
									wp.element.createElement( 'div', {
										className: 'atera-cc__panel-title',
										style: {
											fontSize: ( local.panelTitleFontSize || 12 ) + 'px',
											color: local.panelTitleColor || '#475569',
											fontWeight: local.panelTitleBold ? 'bold' : 'normal',
										},
									}, local.panelTitle || __( 'Adjust the scales below to see your savings:', 'atera-compact-calculator' ) )
								),
								wp.element.createElement( 'div', { className: 'atera-cc__sliders' } )
							),
							wp.element.createElement(
								'aside',
								{ className: 'atera-cc__panel atera-cc__panel--result', 'aria-live': 'polite' },
								wp.element.createElement( 'div', { className: 'atera-cc__save-label' }, __( 'You save', 'atera-compact-calculator' ) ),
								wp.element.createElement( 'div', { className: 'atera-cc__save-value' }, '$0' ),
								wp.element.createElement( 'div', { className: 'atera-cc__save-sub' }, __( 'annually — estimated based on Atera\'s Pro Plan', 'atera-compact-calculator' ) ),
								wp.element.createElement(
									'div',
									{ className: 'atera-cc__email-wrapper' },
									wp.element.createElement( 'input', { type: 'email', className: 'atera-cc__email', placeholder: __( 'Enter your work email', 'atera-compact-calculator' ), 'aria-label': __( 'Enter your work email', 'atera-compact-calculator' ) } ),
									wp.element.createElement( 'div', { className: 'atera-cc__thank-you', style: { display: 'none' } }, __( 'Thank you', 'atera-compact-calculator' ) )
								),
								local.ctaUrl && local.ctaUrl.trim() 
									? wp.element.createElement( 'a', { className: 'atera-cc__cta', href: local.ctaUrl.trim(), role: 'button' }, local.ctaText || __( 'Start free trial', 'atera-compact-calculator' ) )
									: wp.element.createElement( 'button', { className: 'atera-cc__cta', type: 'button' }, local.ctaText || __( 'Start free trial', 'atera-compact-calculator' ) ),
								wp.element.createElement( 'div', { className: 'atera-cc__cta-note' }, local.ctaNote || __( 'No credit card required', 'atera-compact-calculator' ) ),
								wp.element.createElement(
									'div',
									{ className: 'atera-cc__costs' },
									wp.element.createElement( 'div', { className: 'atera-cc__costs-title' }, __( 'Average annual cost', 'atera-compact-calculator' ) ),
									wp.element.createElement(
										'div',
										{ className: 'atera-cc__costs-row' },
										wp.element.createElement( 'span', { className: 'atera-cc__costs-name atera-cc__costs-name--atera' }, 'Atera' ),
										wp.element.createElement( 'span', { className: 'atera-cc__costs-val atera-cc__costs-val--atera' }, '$0' )
									),
									wp.element.createElement(
										'div',
										{ className: 'atera-cc__costs-row' },
										wp.element.createElement( 'span', { className: 'atera-cc__costs-name atera-cc__costs-name--provider' }, __( 'Current provider', 'atera-compact-calculator' ) ),
										wp.element.createElement( 'span', { className: 'atera-cc__costs-val atera-cc__costs-val--provider' }, '$0' )
									)
								),
								wp.element.createElement( 'div', { className: 'atera-cc__footnote', hidden: !local.resultDescription }, local.resultDescription || '' )
							)
						)
					)
				)
			);
		},
		save: () => null,
	} );
} )( window.wp );
