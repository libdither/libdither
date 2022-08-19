{
	inputs = {
		nixpkgs.url = "github:NixOS/nixpkgs/nixos-21.05";
		utils.url = "github:gytis-ivaskevicius/flake-utils-plus";
  	};

  	outputs = { self, nixpkgs, utils, ... } @inputs:
	let
		inherit (builtins) removeAttrs;
		mkApp = utils.lib.mkApp;
		pkgs = self.pkgs.x86_64-linux.nixpkgs;

		buildInputs = with pkgs; [
			hugo
			mdbook
		];
	in utils.lib.mkFlake {
		inherit self inputs;
		supportedSystems = [ "x86_64-linux" ];
		channels.nixpkgs.input = nixpkgs;

		outputsBuilder = channels: {
			defaultPackage = channels.nixpkgs.stdenv.mkDerivation rec {
				name = "dither-link";
				src = ./.;
				nativeBuildInputs = buildInputs;
				buildPhase = ''
					hugoix 
				'';
				installPhase = ''
					cp -r public $out
				'';
			};
			devShell = pkgs.mkShell {
				inherit buildInputs;
			};
		};
	};
}