import threading
import time

passageiros = [4,6,8]

lock = threading.Lock()

def elevador():
    print ('O elevador se encontra no terreo')
    while passageiros:
        lock.acquire()
        passEmbarcado = passageiros.pop(0)
        lock.release()

        print (f'Passageiro vai para o andar {passEmbarcado}')
        
        for j in range (passEmbarcado):
            print (f'elevador subindo: {j+1} andar')
            time.sleep(0.5)
            if j+1 == passEmbarcado:
                print (f'O elevador chegou ao andar {j+1}')
                time.sleep(2)
                for k in range(passEmbarcado, -1, -1):
                    print (f'elevador descendo: {k} andar')
                    time.sleep(0.5)
                    if k == 0:
                        print ('O elevador chegou ao terreo')
                        time.sleep(2)
                        print (passageiros)

t1 = threading.Thread(target = (elevador))
t2 = threading.Thread(target = (elevador))
#t3 = threading.Thread(target = (elevador))

inicio = time.time()

t1.start()
t2.start()
#t3.start()

t1.join()
t2.join()
#t3.join()

fim = time.time()
print ('tempo: ', fim - inicio)