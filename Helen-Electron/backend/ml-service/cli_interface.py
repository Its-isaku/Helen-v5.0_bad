from typing import Dict, Tuple
from model.interfaces import IUserInterface


class TerminalUI(IUserInterface):
    """
    Implementación de UI para terminal (Single Responsibility)
    Solo se encarga de mostrar info y capturar input del usuario
    """
    
    def show_menu(self) -> str:
        """Muestra el menú principal y retorna la opción seleccionada"""
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                 GESTIÓN Y ENTRENAMIENTO DEL MODELO HELEN")
        print(" <|" + "-" * 66 + "|>")
        print("\n                               OPCIONES:" + "\n")
        print("  1. Entrenar modelo con GESTOS ACTUALES")
        print("  2. Agregar NUEVO GESTO, grabar y actualizar mapeo")
        print("  3. Grabar MÁS VIDEOS para un gesto EXISTENTE")
        print("  4. PROBAR MODELO EN VIVO con cámara")
        print("  5. Ver GESTOS REGISTRADOS")
        print("  6. Salir")
        print("\n" + " <|" + "-" * 66 + "|>")
        
        choice = input("\n <|------------------ Seleccione una opción (1-6): ------------------|> ").strip()
        return choice
    
    def get_training_params(self) -> Dict[str, any]:
        """Solicita parámetros de entrenamiento al usuario"""
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                     CONFIGURACIÓN DE ENTRENAMIENTO")
        print(" <|" + "-" * 66 + "|>" + "\n")
        
        epochs_input = input("  Número de épocas (default: 30): ").strip()
        epochs = int(epochs_input) if epochs_input else 30
        
        batch_input = input("  Tamaño del batch (default: 32): ").strip()
        batch_size = int(batch_input) if batch_input else 32
        
        return {
            'epochs': epochs,
            'batch_size': batch_size
        }
    
    def get_gesture_info(self) -> Tuple[str, str]:
        """Obtiene información para agregar un nuevo gesto"""
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                        AGREGAR NUEVO GESTO")
        print(" <|" + "-" * 66 + "|>" + "\n")
        gesture_name = input("  Nombre del gesto (ej: 'hola'): ").strip().lower()
        dataset_path = input("  Ruta al dataset (default: ../dataset_gestos): ").strip()
        
        if not dataset_path:
            dataset_path = "../dataset_gestos"
        
        return gesture_name, dataset_path
    
    def select_existing_gesture(self, gestures_map: Dict[str, int]) -> Tuple[str, str]:
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                 AGREGAR MÁS VIDEOS A GESTO EXISTENTE")
        print(" <|" + "-" * 66 + "|>")
        print("\n                          GESTOS DISPONIBLES:\n")
        
        # Mostrar lista numerada de gestos
        gesture_list = sorted(gestures_map.keys())  # Ordenar alfabéticamente
        for idx, gesture in enumerate(gesture_list, 1):
            print(f"    {idx}. {gesture} (ID: {gestures_map[gesture]})")
        
        print("\n" + " <|" + "-" * 66 + "|>")
        
        # Pedir selección
        while True:
            try:
                selection = input(f"\n  Selecciona el gesto (1-{len(gesture_list)}): ").strip()
                selection_idx = int(selection) - 1
                
                if 0 <= selection_idx < len(gesture_list):
                    selected_gesture = gesture_list[selection_idx]
                    break
                else:
                    print(f"\n  ❌ Error: Selecciona un número entre 1 y {len(gesture_list)}")
            except ValueError:
                print("\n  ❌ Error: Ingresa un número válido")
        
        # Pedir ruta del dataset
        dataset_path = input("\n  Ruta al dataset (default: ../dataset_gestos): ").strip()
        if not dataset_path:
            dataset_path = "../dataset_gestos"
        
        return selected_gesture, dataset_path
    
    def show_message(self, message: str, message_type: str = "info") -> None:
        """Muestra un mensaje al usuario con formato"""
        icons = {
            "info": "ℹ️",
            "success": "✅",
            "warning": "⚠️",
            "error": "❌"
        }
        icon = icons.get(message_type, "")
        print(f"\n  {icon} {message}")
    
    def show_progress(self, current: int, total: int, metrics: Dict) -> None:
        """Muestra el progreso del entrenamiento"""
        train_loss = metrics.get('train_loss', 0)
        val_loss = metrics.get('val_loss', 0)
        val_acc = metrics.get('val_acc', 0)
        
        # Mostrar solo cada 5 épocas o la primera
        if current % 5 == 0 or current == 1:
            print(
                f"  Época {current:3d}/{total} | "
                f"Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | "
                f"Val Acc: {val_acc:.2%}"
            )
    
    def show_training_start(self, info: Dict) -> None:
        """Muestra información al iniciar el entrenamiento"""
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                          INICIANDO ENTRENAMIENTO")
        print(" <|" + "-" * 66 + "|>")
        print(f"\n  Número de clases: {info['n_classes']}")
        print(f"  Dispositivo: {info['device']}")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")
    
    def show_training_complete(self, results: Dict) -> None:
        """Muestra resumen al completar el entrenamiento"""
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                        ENTRENAMIENTO COMPLETADO")
        print(" <|" + "-" * 66 + "|>")
        print(f"\n    Mejor Accuracy: {results['best_val_acc']:.2%}")
        print(f"    Modelo guardado exitosamente")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")
    
    def show_gestures(self, gestures_map: Dict[str, int]) -> None:
        """Muestra los gestos registrados en formato tabla"""
        if not gestures_map:
            self.show_message("No hay gestos registrados aún.", "warning")
            return
        
        print("\n" + " <|" + "-" * 66 + "|>")
        print("                          GESTOS REGISTRADOS")
        print(" <|" + "-" * 66 + "|>" + "\n")
        for gesture, label in sorted(gestures_map.items(), key=lambda x: x[1]):
            print(f"    [{label}] {gesture}")
        print(f"\n  Total: {len(gestures_map)} gestos")
        print("\n" + " <|" + "-" * 66 + "|>" + "\n")
    
    def wait_for_input(self) -> None:
        """Espera input del usuario antes de continuar"""
        input("\n  [Presiona ENTER para continuar...]")
