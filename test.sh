pushd tests/$1
rm -rf shadow.data
shadow config.yaml > shadow.log
popd