#!/usr/bin/env bash
# One-time environment for a reel project. Usage: bash setup_env.sh <workdir>   (creates <workdir>/venv and <workdir>/dfm)
# Heavy installs (torch CPU ≈ 200 MB, whisper large-v3 ≈ 3 GB on first use). Run in the background while you look at footage.
set -e
WD=${1:-.}; cd "$WD"
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q numpy scipy librosa faster-whisper "rembg[cpu]" opencv-python-headless pillow fonttools
timeout 900 ./venv/bin/pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
timeout 600 ./venv/bin/pip install -q deepfilternet
# deepfilternet 0.5.6 imports a torchaudio symbol that newer torchaudio removed → make it optional
f=$(ls venv/lib/python3*/site-packages/df/io.py)
grep -q "AudioMetaData = object" "$f" || sed -i 's/^from torchaudio.backend.common import AudioMetaData/try:\n    from torchaudio.backend.common import AudioMetaData\nexcept Exception:\n    AudioMetaData = object/' "$f"
# DeepFilterNet3 weights: GitHub releases may be blocked by the proxy → HuggingFace mirror
if [ ! -f dfm/DeepFilterNet3/config.ini ]; then
  mkdir -p dfm && curl -sS -L -m 300 -o dfm/DeepFilterNet3.zip "https://huggingface.co/niobures/DeepFilterNet/resolve/main/models/onnx/DeepFilterNet/DeepFilterNet3.zip"
  (cd dfm && unzip -o -q DeepFilterNet3.zip)
fi
./venv/bin/python -c "from df.enhance import init_df; m,s,_=init_df(model_base_dir='dfm/DeepFilterNet3'); print('DFN ok', s.sr())"
./venv/bin/python -c "import faster_whisper, rembg, cv2, librosa; print('venv ok')"
