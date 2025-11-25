"""
Cliente de Ejemplo para Helen API
Demuestra cómo hacer peticiones al servidor desde el frontend
"""

import requests
import numpy as np
import json
import time


class HelenAPIClient:
    """Cliente para interactuar con Helen API"""
    
    def __init__(self, base_url="http://localhost:5000"):
        """
        Args:
            base_url (str): URL del servidor API
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
    
    def check_connection(self):
        """Verificar que el API esté disponible"""
        try:
            response = self.session.get(f"{self.base_url}/")
            response.raise_for_status()
            data = response.json()
            
            print("\n✅ Conexión establecida con el servidor")
            print(f"  Estado: {data['status']}")
            print(f"  Modelo cargado: {data['model_loaded']}")
            print(f"  Gestos disponibles: {', '.join(data['gestures_available'])}")
            print(f"  Total de clases: {data['n_classes']}")
            print(f"  Dispositivo: {data['device']}")
            
            return True
            
        except requests.exceptions.ConnectionError:
            print(f"\n❌ No se pudo conectar al servidor en {self.base_url}")
            print("   Verifica que el servidor esté corriendo")
            return False
        
        except Exception as e:
            print(f"\n❌ Error al verificar conexión: {e}")
            return False
    
    def get_gestures(self):
        """Obtener lista de gestos disponibles"""
        try:
            response = self.session.get(f"{self.base_url}/gestures")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Error al obtener gestos: {e}")
            return None
    
    def predict(self, sequence):
        """
        Realizar predicción de gesto
        
        Args:
            sequence (list): Lista de frames con 63 features cada uno
                           Ejemplo: [[x1, y1, z1, ...], [x1, y1, z1, ...], ...]
        
        Returns:
            dict: Resultado de la predicción
        """
        try:
            # Validar entrada
            if not isinstance(sequence, list):
                raise ValueError("La secuencia debe ser una lista")
            
            if len(sequence) == 0:
                raise ValueError("La secuencia no puede estar vacía")
            
            if len(sequence[0]) != 63:
                raise ValueError(f"Cada frame debe tener 63 features, recibido: {len(sequence[0])}")
            
            # Hacer request
            payload = {"sequence": sequence}
            response = self.session.post(
                f"{self.base_url}/predict",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error en la petición: {e}")
            return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def health_check(self):
        """Verificar estado de salud del servicio"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Error al verificar salud: {e}")
            return None


def demo_basic_usage(api_url="http://localhost:5000"):
    """Demostración básica de uso del cliente"""
    
    print("\n" + "="*70)
    print("🚀 DEMO: Cliente Helen API")
    print("="*70)
    
    # Crear cliente
    client = HelenAPIClient(base_url=api_url)
    
    # 1. Verificar conexión
    print("\n[1/4] Verificando conexión...")
    if not client.check_connection():
        return
    
    time.sleep(1)
    
    # 2. Obtener gestos disponibles
    print("\n[2/4] Obteniendo gestos disponibles...")
    gestures_data = client.get_gestures()
    
    if gestures_data:
        print(f"  ✅ Gestos: {', '.join(gestures_data['gestures'])}")
    
    time.sleep(1)
    
    # 3. Crear secuencia de ejemplo (40 frames con 63 features)
    print("\n[3/4] Generando secuencia de prueba...")
    print("  (Datos sintéticos aleatorios)")
    
    # En producción, estos datos vendrían de MediaPipe procesando video
    sequence = np.random.rand(40, 63).tolist()
    
    print(f"  ✅ Secuencia creada: {len(sequence)} frames x {len(sequence[0])} features")
    
    time.sleep(1)
    
    # 4. Hacer predicción
    print("\n[4/4] Realizando predicción...")
    
    start_time = time.time()
    result = client.predict(sequence)
    elapsed_time = (time.time() - start_time) * 1000  # ms
    
    if result and result.get('status') == 'success':
        print(f"\n  ✅ Predicción exitosa ({elapsed_time:.2f} ms)")
        print(f"  🎯 Gesto detectado: {result['prediccion_gesto']}")
        print(f"  📊 Confianza: {result['probabilidad_maxima']:.2%}")
        
        print(f"\n  📈 Todas las probabilidades:")
        for gesture, prob in result['todas_probabilidades'].items():
            bar = "█" * int(prob * 50)
            print(f"    {gesture:12s} {prob:.2%} {bar}")
    
    print("\n" + "="*70)
    print("✅ Demo completada")
    print("="*70 + "\n")


def demo_multiple_predictions(api_url="http://localhost:5000", n_predictions=5):
    """Demostración de múltiples predicciones"""
    
    print("\n" + "="*70)
    print(f"🚀 DEMO: Múltiples Predicciones ({n_predictions} requests)")
    print("="*70)
    
    client = HelenAPIClient(base_url=api_url)
    
    if not client.check_connection():
        return
    
    print(f"\n📡 Enviando {n_predictions} peticiones...")
    
    times = []
    
    for i in range(n_predictions):
        sequence = np.random.rand(40, 63).tolist()
        
        start = time.time()
        result = client.predict(sequence)
        elapsed = (time.time() - start) * 1000
        
        times.append(elapsed)
        
        if result and result.get('status') == 'success':
            print(f"  [{i+1}/{n_predictions}] {result['prediccion_gesto']:12s} "
                  f"({result['probabilidad_maxima']:.2%}) - {elapsed:.2f} ms")
        else:
            print(f"  [{i+1}/{n_predictions}] ❌ Error")
    
    # Estadísticas
    if times:
        avg_time = np.mean(times)
        min_time = np.min(times)
        max_time = np.max(times)
        
        print(f"\n📊 Estadísticas de latencia:")
        print(f"  Promedio: {avg_time:.2f} ms")
        print(f"  Mínimo:   {min_time:.2f} ms")
        print(f"  Máximo:   {max_time:.2f} ms")
    
    print("\n" + "="*70 + "\n")


def demo_error_handling(api_url="http://localhost:5000"):
    """Demostración de manejo de errores"""
    
    print("\n" + "="*70)
    print("🚀 DEMO: Manejo de Errores")
    print("="*70)
    
    client = HelenAPIClient(base_url=api_url)
    
    if not client.check_connection():
        return
    
    # Error 1: Secuencia vacía
    print("\n[Test 1] Secuencia vacía:")
    result = client.predict([])
    
    # Error 2: Features incorrectos
    print("\n[Test 2] Features incorrectos (10 en vez de 63):")
    bad_sequence = [[0.5] * 10] * 40
    result = client.predict(bad_sequence)
    
    # Error 3: Longitud incorrecta
    print("\n[Test 3] Longitud incorrecta (10 frames en vez de 40):")
    short_sequence = [[0.5] * 63] * 10
    result = client.predict(short_sequence)
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Cliente de prueba para Helen API')
    parser.add_argument('--url', type=str, default='http://localhost:5000',
                      help='URL del servidor API')
    parser.add_argument('--demo', type=str, default='basic',
                      choices=['basic', 'multiple', 'errors', 'all'],
                      help='Tipo de demo a ejecutar')
    
    args = parser.parse_args()
    
    print(f"\n🔗 Conectando a: {args.url}")
    
    if args.demo == 'basic' or args.demo == 'all':
        demo_basic_usage(args.url)
    
    if args.demo == 'multiple' or args.demo == 'all':
        demo_multiple_predictions(args.url, n_predictions=10)
    
    if args.demo == 'errors' or args.demo == 'all':
        demo_error_handling(args.url)
    
    print("\n💡 Para probar en tu servidor EC2:")
    print(f"   python example_client.py --url http://<TU_IP_EC2>:5000\n")
