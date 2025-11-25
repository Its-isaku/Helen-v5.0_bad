import os
from dotenv import load_dotenv

from pathlib import Path
import sys
import subprocess

from model.interfaces import IUserInterface, IDataLoader, IModelSaver, IGestureRepository
from model.training_service import ModelTrainingService, StandardTrainingStrategy


"""
Main Controller for Helen Gesture Recognition Application (Single Responsibility Principle).

Coordinates the application flow and connects the user interface with business services.

Responsibilities:
    - Coordinate application flow
    - Connect UI with business services
Does NOT:
    - Perform direct training
    - Access files directly
    - Display UI directly

All documentation and comments are in English for professional standards.
"""

###############################################################################
# Main Application Controller
###############################################################################

class GestureRecognitionController:
    """
    Main controller for the application (Single Responsibility Principle).

    Responsibilities:
        - Coordinate application flow
        - Connect UI with business services
    Does NOT:
        - Perform direct training
        - Access files directly
        - Display UI directly
    """
    
    def __init__(
        self,
        ui: IUserInterface,
        training_service: ModelTrainingService,
        gesture_repo: IGestureRepository,
        base_dir: Path,
        dataset_path: str = "../dataset_gestos"
    ):
        """
        Initialize the controller with dependency injection.

        Args:
            ui (IUserInterface): User interface implementation.
            training_service (ModelTrainingService): Training service instance.
            gesture_repo (IGestureRepository): Gesture repository instance.
            base_dir (Path): Base directory for the project.
            dataset_path (str): Path to the gesture dataset.
        """
        self.ui = ui
        self.training_service = training_service
        self.gesture_repo = gesture_repo
        self.base_dir = base_dir
        self.dataset_path = dataset_path
        self.needs_data_prep = False

    def run(self) -> None:
        """
        Main application loop. Presents the menu and handles user choices.
        """
        while True:
            # Show menu and get user choice
            choice = self.ui.show_menu()
            if choice == "1":
                self._handle_training()
            elif choice == "2":
                self._handle_add_gesture()
            elif choice == "3":
                self._handle_add_videos_to_existing_gesture()
            elif choice == "4":
                self._handle_test_model_live()
            elif choice == "5":
                self._handle_show_gestures()
            elif choice == "6":
                self.ui.show_message("Goodbye!", "info")
                break
            else:
                self.ui.show_message("Invalid option", "error")
        if self.needs_data_prep:
            self._run_data_prep_automatically()
    
    def _handle_training(self) -> None:
        """
        Handle the training workflow: checks data, gets parameters, runs training, and reports progress.
        """
        # Verify that training data exists
        info = self.training_service.get_training_info()
        if not info['data_exists']:
            self.ui.show_message(
                "No training data found. Run 'python data_prep.py --dataset <path>' first.",
                "error"
            )
            return
        if info['n_gestures'] == 0:
            self.ui.show_message(
                "No gestures registered in gestures_map.json",
                "error"
            )
            return
        # Get training parameters from user
        params = self.ui.get_training_params()
        # Show initial training info
        self.ui.show_training_start({
            'n_classes': info['n_gestures'],
            'device': info['device']
        })
        # Paths for saving model and stats
        model_path = self.base_dir / "trained_models" / "model_final.pth"
        norm_stats_path = self.base_dir / "trained_models" / "normalization_stats.pth"
        try:
            # Run training
            for progress in self.training_service.train_model(
                epochs=params['epochs'],
                batch_size=params['batch_size'],
                model_save_path=model_path,
                norm_stats_path=norm_stats_path
            ):
                # Show progress
                self.ui.show_progress(
                    current=progress['epoch'],
                    total=progress['total_epochs'],
                    metrics=progress
                )
            # Show final summary
            self.ui.show_training_complete({
                'best_val_acc': progress.get('best_val_acc', 0)
            })
        except Exception as e:
            self.ui.show_message(f"Error during training: {e}", "error")
    
    def _handle_add_gesture(self) -> None:
        """
        Handle the workflow for adding a new gesture: get info, check existence, add, and record videos.
        """
        # Get gesture info from user
        gesture_name, dataset_path = self.ui.get_gesture_info()
        if not gesture_name or not dataset_path:
            self.ui.show_message("Incomplete information", "error")
            return
        # Check if gesture already exists
        gestures_map = self.gesture_repo.load_gestures_map()
        if gesture_name in gestures_map:
            self.ui.show_message(
                f"Gesture '{gesture_name}' already exists with ID {gestures_map[gesture_name]}",
                "warning"
            )
            return
        # Add gesture to repository
        new_id = self.gesture_repo.add_gesture(gesture_name)
        self.ui.show_message(
            f"Gesture '{gesture_name}' added with ID {new_id}",
            "success"
        )
        # Call video recording script
        self.ui.show_message(
            "Starting video recording...\n"
            "  Press 's' to record each clip (3 seconds)\n"
            "  Press 'q' to finish",
            "info"
        )
        try:
            grabar_script = self.base_dir / "grabarVideo.py"
            subprocess.run([
                sys.executable,
                str(grabar_script),
                gesture_name,
                dataset_path
            ])
            self.needs_data_prep = True
            self.dataset_path = dataset_path
            self.ui.show_message(
                f" Videos recorded successfully.\n"
                f" On exit, data_prep.py will run automatically.",
                "success"
            )
        except FileNotFoundError:
            self.ui.show_message(
                "grabarVideo.py not found",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error running video recording: {e}",
                "error"
            )
    
    def _handle_add_videos_to_existing_gesture(self) -> None:
        """
        Handle adding videos to an existing gesture: select gesture, record more videos, and mark for data prep.
        """
        # Get existing gestures
        gestures_map = self.gesture_repo.load_gestures_map()
        if not gestures_map:
            self.ui.show_message(
                "No gestures registered. Use option 2 to add a new one.",
                "warning"
            )
            return
        # Allow user to select existing gesture
        gesture_name, dataset_path = self.ui.select_existing_gesture(gestures_map)
        if not gesture_name or not dataset_path:
            self.ui.show_message("Incomplete information", "error")
            return
        # Show instructions
        self.ui.show_message(
            f"Recording more videos for gesture: '{gesture_name}'\n"
            "  Press 's' to record each clip (3 seconds)\n"
            "  Press 'q' to finish",
            "info"
        )
        try:
            grabar_script = self.base_dir / "grabarVideo.py"
            subprocess.run([
                sys.executable,
                str(grabar_script),
                gesture_name,
                dataset_path
            ])
            # Mark that data_prep needs to be run
            self.needs_data_prep = True
            self.dataset_path = dataset_path
            self.ui.show_message(
                f" Additional videos recorded successfully for '{gesture_name}'.\n"
                f" On exit, data_prep.py will run automatically.",
                "success"
            )
        except FileNotFoundError:
            self.ui.show_message(
                "grabarVideo.py not found",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error running video recording: {e}",
                "error"
            )
    
    def _handle_test_model_live(self) -> None:
        """
        Handle the workflow for live model testing: check files, show instructions, and run test script.
        """
        # Verify that trained model and required files exist
        model_path = self.base_dir / "trained_models" / "model_final.pth"
        gestures_map_path = self.base_dir / "data" / "gestures_map.json"
        norm_stats_path = self.base_dir / "trained_models" / "normalization_stats.pth"
        if not model_path.exists():
            self.ui.show_message(
                "Trained model (model_final.pth) not found. Train the model first (option 1).",
                "error"
            )
            return
        if not gestures_map_path.exists():
            self.ui.show_message(
                "gestures_map.json not found",
                "error"
            )
            return
        if not norm_stats_path.exists():
            self.ui.show_message(
                "Normalization statistics not found. Train the model first (option 1).",
                "error"
            )
            return
        # Show instructions
        self.ui.show_message(
            "Starting live model test...\n"
            "  - The camera will open\n"
            "  - Perform gestures in front of the camera\n"
            "  - Predictions will appear every 2 seconds\n"
            "  - Press 'q' to exit",
            "info"
        )
        try:
            test_script = self.base_dir / "test_model_live.py"
            if not test_script.exists():
                self.ui.show_message(
                    "test_model_live.py not found in the base directory.\n"
                    "    Make sure the file exists.",
                    "error"
                )
                return
            subprocess.run([sys.executable, str(test_script)])
            self.ui.show_message(
                "Live test finished",
                "success"
            )
        except FileNotFoundError:
            self.ui.show_message(
                "test_model_live.py not found",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error running live test: {e}",
                "error"
            )
    
    def _handle_show_gestures(self) -> None:
        """
        Show registered gestures to the user.
        """
        gestures_map = self.gesture_repo.load_gestures_map()
        self.ui.show_gestures(gestures_map)
        self.ui.wait_for_input()
    
    def _run_data_prep_automatically(self) -> None:
        """
        Run data preprocessing automatically after video recording.
        """
        self.ui.show_message(
            "\nRunning data preprocessing automatically...",
            "info"
        )
        try:
            data_prep_script = self.base_dir / "data_prep.py"
            result = subprocess.run([
                sys.executable,
                str(data_prep_script),
                "--dataset", self.dataset_path,
                "--output", str(self.base_dir),
                "--seq-length", "40"
            ], capture_output=True, text=True)
            if result.returncode == 0:
                self.ui.show_message(
                    "Preprocessing completed successfully.\n"
                    "Files X_data.npy, Y_labels.npy, and gestures_map.json have been updated.",
                    "success"
                )
                print(result.stdout)
            else:
                self.ui.show_message(
                    f"Error running data_prep.py:\n{result.stderr}",
                    "error"
                )
        except FileNotFoundError:
            self.ui.show_message(
                "data_prep.py not found in the base directory",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error running data_prep.py: {e}",
                "error"
            )



def create_application(base_dir: str = ".") -> GestureRecognitionController:
    """
    Factory function to create the application with all dependencies configured (manual dependency injection).

    Args:
        base_dir (str): Base directory of the project (where .npy files, model.pth, etc. are located).

    Returns:
        GestureRecognitionController: Configured and ready to use.
    """
    from model.repositories import FileDataLoader, TorchModelSaver, JsonGestureRepository
    from cli_interface import TerminalUI
    base_path = Path(base_dir)
    data_loader = FileDataLoader(base_path / "data")
    model_saver = TorchModelSaver()
    gesture_repo = JsonGestureRepository(base_path / "data" / "gestures_map.json")
    training_strategy = StandardTrainingStrategy()
    training_service = ModelTrainingService(
        data_loader=data_loader,
        model_saver=model_saver,
        gesture_repo=gesture_repo,
        training_strategy=training_strategy
    )
    ui = TerminalUI()
    return GestureRecognitionController(
        ui=ui,
        training_service=training_service,
        gesture_repo=gesture_repo,
        base_dir=base_path
    )



###############################################################################
# Main Entrypoint
###############################################################################

if __name__ == "__main__":
    """
    Application entry point.
    """
    app = create_application()
    app.run()
