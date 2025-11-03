import server from "./server";
import colors from 'colors'

const PORT = Math.floor(Math.random() * (65535 - 1024) + 1024); // Entre 1024 y 65535

server.listen(PORT, () => {
    console.log(colors.bgCyan(`REST API en el puesto ${PORT}`));
});