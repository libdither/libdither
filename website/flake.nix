{
  	inputs = {
		nixpkgs.url = "github:NixOS/nixpkgs/nixos-21.05";
		utils.url = "github:gytis-ivaskevicius/flake-utils-plus";
		npm-buildpackage.url = "github:serokell/nix-npm-buildpackage";
		/* pug-src.url = github:pugjs/pug;
		pug-src.flake = false; */
  	};

  	outputs = { self, nixpkgs, utils, npm-buildpackage, ... } @inputs:
	let
		inherit (builtins) removeAttrs;
		mkApp = utils.lib.mkApp;
		pkgs = self.pkgs.x86_64-linux.nixpkgs;

		pug = pkgs.mkYarnPackage {
			src = ./.;
			yarnBuild = "yarn build";
		};
		buildInputs = [
			pkgs.nodejs pug
		];
		nativeBuildInputs = with pkgs; [
			nixpkgs-fmt
		];
	in utils.lib.mkFlake {
		inherit self inputs;

		supportedSystems = [ "x86_64-linux" ];

		#channels.nixpkgs.input = nixpkgs;
		
		outputsBuilder = channels: {
			defaultPackage = pug;
			/* defaultPackage = channels.nixpkgs.stdenv.mkDerivation rec {
				name = "dither-link";
				src = ./.;
				nativeBuildInputs = with pkgs; [ pandoc pug ];
				buildPhase = ''
					bash pdsite init
				'';
				installPhase = ''
					cp -r static $out/
				'';
			}; */
			devShell = pkgs.mkShell {
				inherit buildInputs nativeBuildInputs;
			};
		};
	};
}