import express from 'express';
import { join } from 'path';

const app = express();

// 设定 public 文件夹为静态资源目录
app.use(express.static(join(process.cwd(), 'public')));

// 设定端口
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
