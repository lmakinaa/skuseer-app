import os
import sys
import logging
import warnings

def setup_logger():
    log_format = "%(asctime)s | %(levelname)-7s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    os.makedirs("logs", exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("logs/seer_engine.log", mode='a')
        ],
        force=True
    )

    warnings.filterwarnings("ignore")
    logging.getLogger("pytorch_lightning").setLevel(logging.ERROR)

    for noisy_module in ["cmdstanpy", "prophet"]:
        noisy_logger = logging.getLogger(noisy_module)
        noisy_logger.addHandler(logging.NullHandler())
        noisy_logger.propagate = False
        noisy_logger.setLevel(logging.CRITICAL)

    return logging.getLogger("SeerEngine")

logger = setup_logger()
