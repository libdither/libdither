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
		];
	in utils.lib.mkFlake {
		inherit self inputs;
		supportedSystems = [ "x86_64-linux" ];
		
		outputsBuilder = channels: {
			devShell = pkgs.mkShell {
				inherit buildInputs;
			};
		};
	};
}