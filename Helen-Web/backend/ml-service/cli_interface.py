
"""
Terminal User Interface for Helen Model Management.

This module provides a command-line interface for managing and training the Helen gesture recognition model.
Implements the IUserInterface contract, handling all user interaction, input, and output in the terminal.

Dependencies:
    - model/interfaces.py: IUserInterface abstract base class

Notes:
    - All prompts and outputs are in English for professional documentation.
    - This UI is used by training and management scripts for user interaction.
"""

from typing import Dict, Tuple
from model.interfaces import IUserInterface

###############################################################################
# Terminal User Interface Implementation
###############################################################################

class TerminalUI(IUserInterface):
    """
    Terminal-based user interface for model management and training.

    Handles all user prompts, menu navigation, and progress reporting for the Helen system.
    Implements the IUserInterface contract.
    """

    def show_menu(self) -> str:
        """
        Display the main menu and return the selected option.

        Returns:
            str: The user's selected menu option.
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                 MODEL MANAGEMENT AND TRAINING - HELEN SYSTEM")
        print(" <|" + "-" * 66 + "|>")
        print("\n                               OPTIONS:" + "\n")
        print("  1. Train model with CURRENT gestures")
        print("  2. Add NEW gesture, record and update mapping")
        print("  3. Record MORE VIDEOS for an EXISTING gesture")
        print("  4. TEST MODEL LIVE with camera")
        print("  5. View REGISTERED gestures")
        print("  6. Exit")
        print("\n" + " <|" + "-" * 66 + "|>")
        choice = input("\n <|------------------ Select an option (1-6): ------------------|> ").strip()
        return choice

    def get_training_params(self) -> Dict[str, any]:
        """
        Prompt the user for training parameters.

        Returns:
            dict: Dictionary with 'epochs' and 'batch_size' keys.
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                     TRAINING CONFIGURATION")
        print(" <|" + "-" * 66 + "|>" + "\n")
        epochs_input = input("  Number of epochs (default: 30): ").strip()
        epochs = int(epochs_input) if epochs_input else 30
        batch_input = input("  Batch size (default: 32): ").strip()
        batch_size = int(batch_input) if batch_input else 32
        return {
            'epochs': epochs,
            'batch_size': batch_size
        }

    def get_gesture_info(self) -> Tuple[str, str]:
        """
        Prompt for information to add a new gesture.

        Returns:
            tuple: (gesture_name, dataset_path)
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                        ADD NEW GESTURE")
        print(" <|" + "-" * 66 + "|>" + "\n")
        gesture_name = input("  Gesture name (e.g., 'hello'): ").strip().lower()
        dataset_path = input("  Dataset path (default: ../dataset_gestos): ").strip()
        if not dataset_path:
            dataset_path = "../dataset_gestos"
        return gesture_name, dataset_path

    def select_existing_gesture(self, gestures_map: Dict[str, int]) -> Tuple[str, str]:
        """
        Prompt the user to select an existing gesture and dataset path.

        Args:
            gestures_map (dict): Mapping of gesture names to IDs.

        Returns:
            tuple: (selected_gesture, dataset_path)
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                 ADD MORE VIDEOS TO EXISTING GESTURE")
        print(" <|" + "-" * 66 + "|>")
        print("\n                          AVAILABLE GESTURES:\n")
        gesture_list = sorted(gestures_map.keys())
        for idx, gesture in enumerate(gesture_list, 1):
            print(f"    {idx}. {gesture} (ID: {gestures_map[gesture]})")
        print("\n" + " <|" + "-" * 66 + "|>")
        while True:
            try:
                selection = input(f"\n  Select gesture (1-{len(gesture_list)}): ").strip()
                selection_idx = int(selection) - 1
                if 0 <= selection_idx < len(gesture_list):
                    selected_gesture = gesture_list[selection_idx]
                    break
                else:
                    print(f"\n  Error: Select a number between 1 and {len(gesture_list)}")
            except ValueError:
                print("\n  Error: Enter a valid number")
        dataset_path = input("\n  Dataset path (default: ../dataset_gestos): ").strip()
        if not dataset_path:
            dataset_path = "../dataset_gestos"
        return selected_gesture, dataset_path

    def show_message(self, message: str, message_type: str = "info") -> None:
        """
        Display a formatted message to the user.

        Args:
            message (str): The message to display.
            message_type (str): Type of message ('info', 'success', 'warning', 'error').
        """
        icons = {
            "info": "[i]",
            "success": "[✓]",
            "warning": "[!]",
            "error": "[x]"
        }
        icon = icons.get(message_type, "")
        print(f"\n  {icon} {message}")

    def show_progress(self, current: int, total: int, metrics: Dict) -> None:
        """
        Display training progress.

        Args:
            current (int): Current epoch.
            total (int): Total epochs.
            metrics (dict): Training/validation metrics.
        """
        train_loss = metrics.get('train_loss', 0)
        val_loss = metrics.get('val_loss', 0)
        val_acc = metrics.get('val_acc', 0)
        if current % 5 == 0 or current == 1:
            print(
                f"  Epoch {current:3d}/{total} | "
                f"Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | "
                f"Val Acc: {val_acc:.2%}"
            )

    def show_training_start(self, info: Dict) -> None:
        """
        Display information at the start of training.

        Args:
            info (dict): Training info (number of classes, device, etc.).
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                          TRAINING STARTED")
        print(" <|" + "-" * 66 + "|>")
        print(f"\n  Number of classes: {info['n_classes']}")
        print(f"  Device: {info['device']}")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")

    def show_training_complete(self, results: Dict) -> None:
        """
        Display summary when training is complete.

        Args:
            results (dict): Training results (best accuracy, etc.).
        """
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                        TRAINING COMPLETED")
        print(" <|" + "-" * 66 + "|>")
        print(f"\n    Best Accuracy: {results['best_val_acc']:.2%}")
        print(f"    Model saved successfully")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")

    def show_gestures(self, gestures_map: Dict[str, int]) -> None:
        """
        Display registered gestures in a table format.

        Args:
            gestures_map (dict): Mapping of gesture names to IDs.
        """
        if not gestures_map:
            self.show_message("No gestures registered yet.", "warning")
            return
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                          REGISTERED GESTURES")
        print(" <|" + "-" * 66 + "|>" + "\n")
        for gesture, label in sorted(gestures_map.items(), key=lambda x: x[1]):
            print(f"    [{label}] {gesture}")
        print(f"\n  Total: {len(gestures_map)} gestures")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")

    def wait_for_input(self) -> None:
        """
        Wait for user input before continuing.
        """
        input("\n  [Press ENTER to continue...]")
