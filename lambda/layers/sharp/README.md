## Instructions to run Docker script

- From the `sharp` directory, run `chmod +x build-sharp-layer.sh`
- Make sure Docker is installed and running locally.
  - You can check Docker version with `docker --version`
- Run the script from the `sharp` directory with `./build-sharp-layer.sh`.
- After running the script, you'll have a new `sharp-lambda-layer.zip` file.
- Use this zip file to upload to AWS as a layer.
