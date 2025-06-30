export const calcAttachDialogue = (
    messages,
    attachedDialogueCount,
    overwrite = true,
) => {
    if (attachedDialogueCount == null) {
        attachedDialogueCount = 10;
    }
    let c = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
        let m = messages[i];
        if (m.role == "system") {
            m.content_attached = true;
            continue;
        }

        if (overwrite) {
            m.content_attached = c < attachedDialogueCount;
        } else {
            if (m.content_attached == false && c < attachedDialogueCount) {
            } else {
                m.content_attached = c < attachedDialogueCount;
            }
        }

        if (m.role == "user") {
            c++;
        }
    }
};

/**
 * Pre组件的Props类型定义
 */
interface PreProps {
  children: React.ReactNode;
}



/**
 * 将URL转换为Base64编码
 * @param url 图片URL
 * @returns Promise<string> Base64编码的图片数据
 */
export function urlToBase64(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // 创建图片对象
    const img = new Image();

    // 跨域支持
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      // 创建画布
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("无法获取2D上下文"));
        return;
      }

      // 设置画布大小
      canvas.width = (this as HTMLImageElement).width;
      canvas.height = (this as HTMLImageElement).height;

      // 绘制图片
      ctx.drawImage(this as HTMLImageElement, 0, 0);

      // 转换为 Base64
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };

    img.onerror = function () {
      reject(new Error("图片加载失败"));
    };

    // 设置图片源
    img.src = url;
  });
}

/**
 * 将Blob对象转换为Base64编码
 * @param blob Blob对象
 * @returns Promise<string> Base64编码的数据
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string); // reader.result 包含 Base64 字符串
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.onabort = () => {
      reject(new Error("读取中断"));
    };

    reader.readAsDataURL(blob);
  });
}