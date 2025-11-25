#!/usr/bin/env python3
"""
Script de Utilidad Helen v5.0
Automatiza tareas comunes del proyecto
"""

import sys
import subprocess
import shutil
from pathlib import Path
import argparse


class HelenUtility:
    """Utilidades para gestión del proyecto Helen"""
    
    def __init__(self):
        self.root = Path.cwd()
        self.model_dir = self.root / "Model-Helen"
        self.api_dir = self.root / "Api-Helen"
    
    def check_environment(self):
        """Verifica que el entorno esté configurado"""
        print("\n🔍 Verificando entorno...")
        
        checks = {
            "Model-Helen existe": self.model_dir.exists(),
            "Api-Helen existe": self.api_dir.exists(),
            "Python 3.8+": sys.version_info >= (3, 8),
        }
        
        all_ok = True
        for check, result in checks.items():
            symbol = "✅" if result else "❌"
            print(f"  {symbol} {check}")
            if not result:
                all_ok = False
        
        return all_ok
    
    def copy_model_files(self):
        """Copia archivos del modelo entrenado a Api-Helen"""
        print("\n📦 Copiando archivos del modelo a Api-Helen...")
        
        files_to_copy = [
            ("model_final.pth", "Modelo entrenado"),
            ("gestures_map.json", "Mapeo de gestos"),
            ("normalization_stats.pth", "Estadísticas de normalización")
        ]
        
        copied = []
        missing = []
        
        for filename, description in files_to_copy:
            src = self.model_dir / filename
            dst = self.api_dir / filename
            
            if src.exists():
                shutil.copy2(src, dst)
                copied.append(description)
                print(f"  ✅ {description} copiado")
            else:
                missing.append(description)
                print(f"  ❌ {description} no encontrado")
        
        if missing:
            print(f"\n⚠️  Archivos faltantes:")
            for item in missing:
                print(f"    - {item}")
            print(f"\n💡 Entrena el modelo primero:")
            print(f"    cd Model-Helen && python train.py")
            return False
        
        print(f"\n✅ Todos los archivos copiados exitosamente!")
        return True
    
    def install_dependencies(self, module="all"):
        """Instala dependencias"""
        print(f"\n📥 Instalando dependencias...")
        
        modules = {
            "model": self.model_dir,
            "api": self.api_dir,
            "all": None
        }
        
        if module == "all":
            dirs = [self.model_dir, self.api_dir]
        else:
            dirs = [modules[module]]
        
        for directory in dirs:
            requirements = directory / "requirements.txt"
            
            if not requirements.exists():
                print(f"  ❌ No se encontró {requirements}")
                continue
            
            print(f"\n  📦 Instalando en {directory.name}...")
            
            try:
                subprocess.run(
                    [sys.executable, "-m", "pip", "install", "-r", str(requirements)],
                    check=True,
                    cwd=directory
                )
                print(f"  ✅ Dependencias instaladas en {directory.name}")
            except subprocess.CalledProcessError:
                print(f"  ❌ Error al instalar dependencias en {directory.name}")
    
    def run_tests(self):
        """Ejecuta los tests del sistema"""
        print("\n🧪 Ejecutando tests del sistema...")
        
        test_script = self.root / "test_system.py"
        
        if not test_script.exists():
            print("  ❌ test_system.py no encontrado")
            return False
        
        try:
            subprocess.run([sys.executable, str(test_script)], check=True)
            return True
        except subprocess.CalledProcessError:
            print("\n  ❌ Algunos tests fallaron")
            return False
    
    def start_api(self, host="0.0.0.0", port=5000, workers=4):
        """Inicia el servidor API"""
        print(f"\n🚀 Iniciando API en {host}:{port}...")
        
        api_script = self.api_dir / "api_service.py"
        
        if not api_script.exists():
            print("  ❌ api_service.py no encontrado")
            return
        
        # Verificar que existan archivos del modelo
        required_files = ["model_final.pth", "gestures_map.json"]
        missing = []
        
        for filename in required_files:
            if not (self.api_dir / filename).exists():
                missing.append(filename)
        
        if missing:
            print(f"\n  ❌ Archivos faltantes en Api-Helen:")
            for f in missing:
                print(f"    - {f}")
            print(f"\n  💡 Ejecuta: python helen_util.py copy-model")
            return
        
        # Intentar usar gunicorn si está disponible
        try:
            subprocess.run(["gunicorn", "--version"], 
                         capture_output=True, check=True)
            use_gunicorn = True
        except (subprocess.CalledProcessError, FileNotFoundError):
            use_gunicorn = False
        
        if use_gunicorn:
            print(f"  🦄 Usando Gunicorn con {workers} workers")
            cmd = [
                "gunicorn",
                "-w", str(workers),
                "-b", f"{host}:{port}",
                "api_service:app"
            ]
        else:
            print(f"  🐍 Usando Flask development server")
            cmd = [sys.executable, str(api_script)]
        
        try:
            subprocess.run(cmd, cwd=self.api_dir)
        except KeyboardInterrupt:
            print("\n\n  ✋ API detenida")
    
    def create_dataset_structure(self, gestures):
        """Crea estructura de directorios para dataset"""
        print("\n📁 Creando estructura de dataset...")
        
        dataset_dir = self.root / "dataset_gestos"
        dataset_dir.mkdir(exist_ok=True)
        
        for gesture in gestures:
            gesture_dir = dataset_dir / gesture.lower()
            gesture_dir.mkdir(exist_ok=True)
            print(f"  ✅ {gesture_dir}")
        
        print(f"\n✅ Estructura creada en: {dataset_dir}")
    
    def show_status(self):
        """Muestra el estado actual del proyecto"""
        print("\n" + "="*70)
        print("📊 ESTADO DEL PROYECTO HELEN v5.0")
        print("="*70)
        
        # Model-Helen
        print("\n📦 Model-Helen:")
        model_files = {
            "X_data.npy": "Datos procesados",
            "Y_labels.npy": "Etiquetas",
            "gestures_map.json": "Mapeo de gestos",
            "model_final.pth": "Modelo entrenado",
            "normalization_stats.pth": "Estadísticas"
        }
        
        for filename, desc in model_files.items():
            exists = (self.model_dir / filename).exists()
            symbol = "✅" if exists else "❌"
            print(f"  {symbol} {desc:30s} ({filename})")
        
        # Api-Helen
        print("\n🌐 Api-Helen:")
        api_files = {
            "model_final.pth": "Modelo",
            "gestures_map.json": "Mapeo",
            "normalization_stats.pth": "Estadísticas"
        }
        
        for filename, desc in api_files.items():
            exists = (self.api_dir / filename).exists()
            symbol = "✅" if exists else "❌"
            print(f"  {symbol} {desc:30s} ({filename})")
        
        # Dataset
        print("\n📹 Dataset:")
        dataset_dir = self.root / "dataset_gestos"
        if dataset_dir.exists():
            gesture_dirs = [d for d in dataset_dir.iterdir() if d.is_dir()]
            print(f"  ✅ {len(gesture_dirs)} gestos registrados")
            for gdir in gesture_dirs:
                videos = list(gdir.glob("*.mp4"))
                print(f"    - {gdir.name}: {len(videos)} videos")
        else:
            print(f"  ❌ Dataset no creado")
        
        print("\n" + "="*70)


def main():
    parser = argparse.ArgumentParser(
        description='Utilidades para Helen v5.0',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python helen_util.py status              # Ver estado del proyecto
  python helen_util.py copy-model          # Copiar modelo a API
  python helen_util.py install             # Instalar todas las dependencias
  python helen_util.py test                # Ejecutar tests
  python helen_util.py start-api           # Iniciar servidor API
  python helen_util.py create-dataset inicio clima noticias
        """
    )
    
    parser.add_argument('command', 
                       choices=['status', 'copy-model', 'install', 'test', 
                               'start-api', 'create-dataset', 'check'],
                       help='Comando a ejecutar')
    
    parser.add_argument('args', nargs='*', 
                       help='Argumentos adicionales (para create-dataset)')
    
    parser.add_argument('--host', default='0.0.0.0',
                       help='Host para API (default: 0.0.0.0)')
    
    parser.add_argument('--port', type=int, default=5000,
                       help='Puerto para API (default: 5000)')
    
    parser.add_argument('--workers', type=int, default=4,
                       help='Workers de Gunicorn (default: 4)')
    
    args = parser.parse_args()
    
    util = HelenUtility()
    
    if args.command == 'check':
        util.check_environment()
    
    elif args.command == 'status':
        util.show_status()
    
    elif args.command == 'copy-model':
        util.copy_model_files()
    
    elif args.command == 'install':
        util.install_dependencies()
    
    elif args.command == 'test':
        util.run_tests()
    
    elif args.command == 'start-api':
        util.start_api(host=args.host, port=args.port, workers=args.workers)
    
    elif args.command == 'create-dataset':
        if not args.args:
            print("❌ Especifica al menos un gesto")
            print("   Ejemplo: python helen_util.py create-dataset inicio clima noticias")
            sys.exit(1)
        util.create_dataset_structure(args.args)


if __name__ == "__main__":
    main()
