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
		pdsite = pkgs.stdenv.mkDerivation {
			name = "pdsite";
			src = ./scripts;
			buildInputs = with pkgs; [ pandoc tree ];
			installPhase = ''
				mkdir -p $out/bin
				cp $src/pdsite $out/bin
			'';
		};

		buildInputs = [
			pkgs.nodejs pug pdsite
		];
	in utils.lib.mkFlake {
		inherit self inputs;

		supportedSystems = [ "x86_64-linux" ];

		#channels.nixpkgs.input = nixpkgs;
		
		outputsBuilder = channels: {
			packages.pug = pug;
			packages.pdsite = pdsite;
			defaultPackage = channels.nixpkgs.stdenv.mkDerivation rec {
				name = "dither-link";
				src = ./.;
				nativeBuildInputs = with pkgs; [ pdsite pug ];
				buildPhase = ''
					pug --help
					bash pdsite init
				'';
				installPhase = ''
					cp -r static $out/
				'';
			};
			devShell = pkgs.mkShell {
				inherit buildInputs;
			};
		};
	};
}