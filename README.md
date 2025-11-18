Atera Compact Calculator – WordPress Block Plugin

A custom WordPress plugin that provides an interactive, fully dynamic Gutenberg block for estimating annual cost savings using configurable sliders.
This plugin includes both frontend and backend logic, a custom REST API endpoint, dynamic block rendering, and full editor customization.

Overview

The Atera Compact Calculator block allows users to dynamically adjust three sliders (technicians, endpoints, and cost per endpoint) and instantly view their estimated annual savings.
All texts, labels, styles, and UI components are customizable directly from the Gutenberg editor through the block’s Inspector panel.

Key Features
Dynamic Gutenberg Block

Rendered via JavaScript on both the editor and frontend.
All calculator attributes and UI components are fully customizable.

 Custom REST API Endpoint

The plugin registers the following endpoint:
/wp-json/atera/v1/calc-sliders

This endpoint loads slider configuration from a JSON file and returns it to the frontend.

 Full Editor Controls (Inspector)

Administrators can customize:

Headline and subtitle

Slider labels (1–3)

Button text and target URL

CTA note text

Result title and description

Panel title text, color, boldness, and font size

Email field visibility (Desktop / Mobile)

Slider visibility toggles

 Pixel-Perfect Figma Implementation

All layout, spacing, typography, fonts, and behavior are built based on the Figma design.

Interactive Calculator Logic

Savings are calculated by the following model:
T = Number of technicians  
E = Number of endpoints  
P = Price per endpoint per month  

Atera annual cost  =  T × 1500  
Provider annual cost = E × P × 12  
Savings = max(provider - atera, 0)
Calculation updates instantly as sliders move.

Folder Structure
atera-compact-calculator/
│
├── atera-compact-calculator.php       ← Main plugin file
│
├── includes/
│   └── class-atera-rest.php           ← Custom REST API implementation
│
├── blocks/
│   └── atera-compact-calculator/
│       ├── block.json                 ← Block configuration
│       ├── index.js                   ← Editor script (Gutenberg)
│       ├── view.js                    ← Frontend calculator logic
│       └── style.css                  ← Block styling
│
├── assets/
│   ├── css/
│   ├── fonts/
│   └── data/
│       └── calc-sliders.json          ← Slider configuration JSON
│
├── .gitignore
└── README.md

 Installation & Usage

Upload the plugin folder into:
wp-content/plugins/atera-compact-calculator/

Activate the plugin in WordPress → Plugins.

In the WordPress editor, add the block:
Atera Compact Calculator

Customize texts and behavior using the Inspector Controls on the right-hand side.

The calculator will automatically fetch slider configuration from the REST API and render dynamically on the frontend.

REST API

Endpoint
/wp-json/atera/v1/calc-sliders
Example Response:
{
  "sliders": [
    { "min": 0, "max": 20, "step": 1, "default": 5 },
    { "min": 0, "max": 2500, "step": 50, "default": 500 },
    { "min": 1, "max": 20, "step": 1, "default": 5, "format": "currency" }
  ]
}

Best Practices Implemented

Modern block registration via apiVersion: 3

Namespace usage in REST API (atera/v1)

Dynamic block rendering pattern (save: null)

JSON-driven UI configuration

Strict separation between Editor (index.js) and Frontend (view.js)

No global pollution — scoped logic & dataset triggers

Accessible markup with ARIA labels and polite announce regions

Responsive design for both desktop and mobile



