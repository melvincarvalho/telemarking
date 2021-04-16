#!/bin/bash

curl "https://chainz.cryptoid.info/marks/api.dws?q=txinfo&t=$1" > $HOME/.gitmark/tx/$1.json