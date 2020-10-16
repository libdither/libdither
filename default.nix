{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
	buildInputs = with pkgs; [
		# Build Tools
		cargo
		cmake
		pkg-config
		
		# Gui Includes
		x11
		xorg.libX11.dev
		xorg.libX11
		xorg.libX11.dev.out
		
		# Protobuf
		protobuf
		python3
	];
	shellHook = 
	''
		export PROTOC=$(which protoc)
	'';
}
