<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route(
		'atera/v1',
		'/calc-sliders',
		[
			'methods'             => WP_REST_Server::READABLE,
			'permission_callback' => '__return_true',
			'callback'            => function () {
				$path = trailingslashit( dirname( __DIR__ ) ) . 'assets/data/calc-sliders.json';
				if ( ! file_exists( $path ) ) {
					return new WP_Error(
						'atera_cc_not_found',
						__( 'Sliders configuration not found.', 'atera-compact-calculator' ),
						[ 'status' => 404 ]
					);
				}
				$contents = file_get_contents( $path );
				if ( $contents === false ) {
					return new WP_Error(
						'atera_cc_read_error',
						__( 'Failed to read sliders configuration.', 'atera-compact-calculator' ),
						[ 'status' => 500 ]
					);
				}
				$data = json_decode( $contents, true );
				if ( json_last_error() !== JSON_ERROR_NONE ) {
					return new WP_Error(
						'atera_cc_bad_json',
						__( 'Invalid sliders configuration JSON.', 'atera-compact-calculator' ),
						[ 'status' => 500 ]
					);
				}
				return new WP_REST_Response(
					$data,
					200,
					[
						'Cache-Control' => 'public, max-age=300',
					]
				);
			},
		]
	);
} );




