import sys, os, subprocess, requests

def main():
    if len(sys.argv) < 2: return
    file_name = sys.argv[1]
    print(f"target_file_name:{file_name}")
    
    # 1. インストール
    target_path = f"./app/{file_name}"
    print(f"installing:{target_path}")
    os.system(f"adb install -r {target_path}")
    
    # 2. GASへ報告（完了後の削除を要請）
    gas_url = os.getenv("GAS_URL")
    print(f"gas_url:{gas_url}")
    
    payload = {"status": "MISSION_COMPLETE", "file_name": file_name}
    print(f"payload:{payload}")
    
    res = requests.post(gas_url, json=payload)
    print(f"gas_res_code:{res.status_code}")
    print("--- Mission Success ---")

if __name__ == "__main__":
    main()
