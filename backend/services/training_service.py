import subprocess
import sys
import os
import threading


class TrainingService:

    def __init__(self):

        self.is_training = False

        self.last_output = ""

    def train(self):

        if self.is_training:

            return {
                "status": "ALREADY_RUNNING",
                "message":
                    "Model training is already running."
            }

        thread = threading.Thread(
            target=self._run_training,
            daemon=True
        )

        thread.start()

        return {
            "status": "STARTED",
            "message":
                "Model training started."
        }

    def _run_training(self):

        self.is_training = True

        try:

            process = subprocess.Popen(
                [
                    sys.executable,
                    "train.py"
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )

            output = []

            for line in process.stdout:

                print(
                    "[TRAIN]",
                    line,
                    end=""
                )

                output.append(line)

            process.wait()

            self.last_output = "".join(
                output
            )

        except Exception as error:

            self.last_output = str(
                error
            )

        finally:

            self.is_training = False

    def get_status(self):

        if self.is_training:

            return "TRAINING"

        return "IDLE"

    def get_output(self):

        return self.last_output