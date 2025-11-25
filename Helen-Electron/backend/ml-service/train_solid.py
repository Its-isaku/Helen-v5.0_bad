import os
from dotenv import load_dotenv

from pathlib import Path
import sys
import subprocess

from model.interfaces import IUserInterface, IDataLoader, IModelSaver, IGestureRepository
from model.training_service import ModelTrainingService, StandardTrainingStrategy


class GestureRecognitionController:
    """
    Controlador Principal de la Aplicación (Single Responsibility)
    
    Responsabilidad:
    - Coordinar el flujo de la aplicación
    - Conectar UI con servicios de negocio
    
    NO hace:
    - Entrenamiento directo
    - Acceso a archivos
    - Mostrar UI directamente
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
        Constructor con Dependency Injection (Dependency Inversion)
        Todas las dependencias son interfaces, no implementaciones concretas
        """
        self.ui = ui
        self.training_service = training_service
        self.gesture_repo = gesture_repo
        self.base_dir = base_dir
        self.dataset_path = dataset_path  
        self.needs_data_prep = False 

    def run(self) -> None:
        """Loop principal de la aplicación"""
        while True:
            #* Mostrar menú y obtener opción
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
                self.ui.show_message("¡Hasta luego!", "info")
                break
            else:
                self.ui.show_message("Opción inválida", "error")
        
        if self.needs_data_prep:
            self._run_data_prep_automatically()
    
    def _handle_training(self) -> None:
        """Maneja el flujo de entrenamiento"""
        #* Verificar que existan datos
        info = self.training_service.get_training_info()
        
        if not info['data_exists']:
            self.ui.show_message(
                "No se encontraron datos de entrenamiento. "
                "Ejecuta 'python data_prep.py --dataset <ruta>' primero.",
                "error"
            )
            return
        
        if info['n_gestures'] == 0:
            self.ui.show_message(
                "No hay gestos registrados en gestures_map.json",
                "error"
            )
            return
        
        #* Obtener parámetros del usuario
        params = self.ui.get_training_params()
        
        #* Mostrar información inicial
        self.ui.show_training_start({
            'n_classes': info['n_gestures'],
            'device': info['device']
        })
        
        #* Paths para guardar
        model_path = self.base_dir / "trained_models" / "model_final.pth"
        norm_stats_path = self.base_dir / "trained_models" / "normalization_stats.pth"
        
        try:
            #* Ejecutar entrenamiento
            for progress in self.training_service.train_model(
                epochs=params['epochs'],
                batch_size=params['batch_size'],
                model_save_path=model_path,
                norm_stats_path=norm_stats_path
            ):
                #* Mostrar progreso
                self.ui.show_progress(
                    current=progress['epoch'],
                    total=progress['total_epochs'],
                    metrics=progress
                )

            #* Mostrar resumen final
            self.ui.show_training_complete({
                'best_val_acc': progress.get('best_val_acc', 0)
            })
            
        except Exception as e:
            self.ui.show_message(f"Error durante el entrenamiento: {e}", "error")
    
    def _handle_add_gesture(self) -> None:
        """Maneja el flujo de agregar un nuevo gesto"""
        #* Obtener información del usuario
        gesture_name, dataset_path = self.ui.get_gesture_info()
        
        if not gesture_name or not dataset_path:
            self.ui.show_message("Información incompleta", "error")
            return

        #* Verificar si el gesto ya existe
        gestures_map = self.gesture_repo.load_gestures_map()
        if gesture_name in gestures_map:
            self.ui.show_message(
                f"El gesto '{gesture_name}' ya existe con ID {gestures_map[gesture_name]}",
                "warning"
            )
            return
        
        #* Agregar gesto al repositorio
        new_id = self.gesture_repo.add_gesture(gesture_name)
        self.ui.show_message(
            f"Gesto '{gesture_name}' agregado con ID {new_id}",
            "success"
        )

        #* Llamar al script de grabación
        self.ui.show_message(
            "Iniciando grabación de videos...\n"
            "  Presiona 's' para grabar cada clip (3 segundos)\n"
            "  Presiona 'q' para terminar",
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
                f" Videos grabados exitosamente.\n"
                f" Al salir se ejecutará automáticamente: data_prep.py",
                "success"
            )
            
        except FileNotFoundError:
            self.ui.show_message(
                "No se encontró grabarVideo.py",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error al ejecutar grabación: {e}",
                "error"
            )
    
    def _handle_add_videos_to_existing_gesture(self) -> None:
        #* Obtener gestos existentes
        gestures_map = self.gesture_repo.load_gestures_map()
        
        if not gestures_map:
            self.ui.show_message(
                "No hay gestos registrados. Usa la opción 2 para agregar uno nuevo.",
                "warning"
            )
            return
        
        #* Permitir al usuario seleccionar un gesto existente
        gesture_name, dataset_path = self.ui.select_existing_gesture(gestures_map)
        
        if not gesture_name or not dataset_path:
            self.ui.show_message("Información incompleta", "error")
            return
        
        #* Mostrar instrucciones
        self.ui.show_message(
            f"📹 Grabando más videos para el gesto: '{gesture_name}'\n"
            "  Presiona 's' para grabar cada clip (3 segundos)\n"
            "  Presiona 'q' para terminar",
            "info"
        )
        
        try:
            #* Ejecutar script de grabación con el gesto seleccionado
            grabar_script = self.base_dir / "grabarVideo.py"
            subprocess.run([
                sys.executable,
                str(grabar_script),
                gesture_name,
                dataset_path
            ])
            
            #* Marcar que se necesita ejecutar data_prep
            self.needs_data_prep = True
            self.dataset_path = dataset_path
            
            self.ui.show_message(
                f"✅ Videos adicionales grabados exitosamente para '{gesture_name}'.\n"
                f"⏳ Al salir se ejecutará automáticamente: data_prep.py",
                "success"
            )
            
        except FileNotFoundError:
            self.ui.show_message(
                "No se encontró grabarVideo.py",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error al ejecutar grabación: {e}",
                "error"
            )
    
    def _handle_test_model_live(self) -> None:
        """Maneja el flujo de testing del modelo en tiempo real"""
        #* Verificar que exista el modelo entrenado
        model_path = self.base_dir / "trained_models" / "model_final.pth"
        gestures_map_path = self.base_dir / "data" / "gestures_map.json"
        norm_stats_path = self.base_dir / "trained_models" / "normalization_stats.pth"
        
        if not model_path.exists():
            self.ui.show_message(
                "No se encontró el modelo entrenado (model_final.pth). "
                "Entrena el modelo primero (opción 1).",
                "error"
            )
            return
        
        if not gestures_map_path.exists():
            self.ui.show_message(
                "No se encontró gestures_map.json",
                "error"
            )
            return
        
        if not norm_stats_path.exists():
            self.ui.show_message(
                "No se encontraron las estadísticas de normalización. "
                "Entrena el modelo primero (opción 1).",
                "error"
            )
            return
        
        #* Mostrar instrucciones
        self.ui.show_message(
            "🎥 Iniciando prueba en vivo del modelo...\n"
            "  - Se abrirá la cámara\n"
            "  - Haz los gestos frente a la cámara\n"
            "  - Las predicciones aparecerán cada 2 segundos\n"
            "  - Presiona 'q' para salir",
            "info"
        )
        
        try:
            #* Ejecutar script de testing en vivo
            test_script = self.base_dir / "test_model_live.py"
            
            if not test_script.exists():
                self.ui.show_message(
                    "⚠️  No se encontró test_model_live.py en el directorio base.\n"
                    "    Asegúrate de que el archivo exista.",
                    "error"
                )
                return
            
            subprocess.run([sys.executable, str(test_script)])
            
            self.ui.show_message(
                "✅ Prueba en vivo finalizada",
                "success"
            )
            
        except FileNotFoundError:
            self.ui.show_message(
                "No se encontró test_model_live.py",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error al ejecutar prueba en vivo: {e}",
                "error"
            )
    
    def _handle_show_gestures(self) -> None:
        """Muestra los gestos registrados"""
        gestures_map = self.gesture_repo.load_gestures_map()
        self.ui.show_gestures(gestures_map)
        self.ui.wait_for_input()
    
    def _run_data_prep_automatically(self) -> None:
        self.ui.show_message(
            "\nEjecutando preprocesamiento de datos automáticamente...",
            "info"
        )
        
        try:
            data_prep_script = self.base_dir / "data_prep.py"
            
            #* Ejecutar data_prep.py con los parámetros correctos
            result = subprocess.run([
                sys.executable,
                str(data_prep_script),
                "--dataset", self.dataset_path,
                "--output", str(self.base_dir),
                "--seq-length", "40"
            ], capture_output=True, text=True)
            
            #* Mostrar output
            if result.returncode == 0:
                self.ui.show_message(
                    "Preprocesamiento completado exitosamente.\n"
                    "Los archivos X_data.npy, Y_labels.npy y gestures_map.json han sido actualizados.",
                    "success"
                )
                print(result.stdout)  #* Mostrar output del script
            else:
                self.ui.show_message(
                    f"❌ Error al ejecutar data_prep.py:\n{result.stderr}",
                    "error"
                )
                
        except FileNotFoundError:
            self.ui.show_message(
                "No se encontró data_prep.py en el directorio base",
                "error"
            )
        except Exception as e:
            self.ui.show_message(
                f"Error al ejecutar data_prep.py: {e}",
                "error"
            )


def create_application(base_dir: str = ".") -> GestureRecognitionController:
    """
    Factory function para crear la aplicación con todas las dependencias configuradas
    (Dependency Injection manual)
    
    Args:
        base_dir: Directorio base del proyecto (donde están los archivos .npy, model.pth, etc.)
    
    Returns:
        GestureRecognitionController configurado y listo para usar
    """
    from model.repositories import FileDataLoader, TorchModelSaver, JsonGestureRepository
    from cli_interface import TerminalUI
    
    base_path = Path(base_dir)
    
    #* Crear todas las dependencias (repositorios y servicios)
    data_loader = FileDataLoader(base_path / "data")
    model_saver = TorchModelSaver()
    gesture_repo = JsonGestureRepository(base_path / "data" / "gestures_map.json")
    training_strategy = StandardTrainingStrategy()
    
    #* Crear servicio de entrenamiento con todas sus dependencias
    training_service = ModelTrainingService(
        data_loader=data_loader,
        model_saver=model_saver,
        gesture_repo=gesture_repo,
        training_strategy=training_strategy
    )
    
    #* Crear UI
    ui = TerminalUI()
    
    #* Crear y retornar controlador
    return GestureRecognitionController(
        ui=ui,
        training_service=training_service,
        gesture_repo=gesture_repo,
        base_dir=base_path
    )


if __name__ == "__main__":
    """Punto de entrada de la aplicación"""
    app = create_application()
    app.run()
