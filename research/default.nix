
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
	buildInputs = with pkgs; [
		# Build Tools
		cargo
		cmake
		pkg-config
		
		# Xserver
		x11
		xorg.libX11.dev
		xorg.libX11
		xorg.libX11.dev.out
		xorg.libXcursor
		
		# Protobuf
		protobuf
		python3
	];
	APPEND_LIBRARY_PATH = with pkgs; pkgs.stdenv.lib.makeLibraryPath [
		vulkan-loader
		xlibs.libXcursor
		xlibs.libXi
		xlibs.libXrandr
	];

	shellHook = ''
		export PROTOC=$(which protoc)
		export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:$APPEND_LIBRARY_PATH"
		export RUSTFLAGS="-C target-cpu=native"
	'';
}
