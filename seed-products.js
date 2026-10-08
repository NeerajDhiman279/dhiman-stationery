const API_URL =
    "https://dhiman-stationery-server.onrender.com/api/products";

const products = [
    {
        id: 1,
        name: "Blue Ball Pen",
        brand: "Cello",
        category: "Pens",
        price: 10,
        oldPrice: 15,
        discount: "33% OFF",
        rating: 4.6,
        reviews: 120,
        stock: 50,
        unit: "pieces",
        description:
            "Smooth writing blue ball pen suitable for school, college and office use.",
        image: "blue-pen.jpg"
    },
    {
        id: 2,
        name: "Classmate Notebook",
        brand: "Classmate",
        category: "Notebooks",
        price: 50,
        oldPrice: 60,
        discount: "16% OFF",
        rating: 4.7,
        reviews: 250,
        stock: 30,
        unit: "pieces",
        description:
            "Good quality Classmate notebook for school, college, notes and daily writing.",
        image: "notebook.jpg"
    },
    {
        id: 3,
        name: "Document File",
        brand: "Solo",
        category: "Files",
        price: 25,
        oldPrice: 35,
        discount: "28% OFF",
        rating: 4.5,
        reviews: 85,
        stock: 25,
        unit: "pieces",
        description:
            "Strong and useful document file for keeping papers, certificates and important documents organized.",
        image: "file.jpg"
    },
    {
        id: 4,
        name: "Long Register",
        brand: "Classmate",
        category: "Notebooks",
        price: 80,
        oldPrice: 100,
        discount: "20% OFF",
        rating: 4.6,
        reviews: 140,
        stock: 20,
        unit: "pieces",
        description:
            "Large long register with quality pages, suitable for school, college and office work.",
        image: "register.jpg"
    }
];

async function seedProducts() {
    try {
        console.log("Checking existing products...");

        const getResponse = await fetch(API_URL);

        if (!getResponse.ok) {
            throw new Error(
                `Unable to fetch products. Status: ${getResponse.status}`
            );
        }

        const data = await getResponse.json();

        const existingProducts = data.products || [];

        console.log(
            `Existing products: ${existingProducts.length}`
        );

        for (const product of products) {
            const alreadyExists = existingProducts.some(
                (item) => Number(item.id) === product.id
            );

            if (alreadyExists) {
                console.log(
                    `Product ${product.id} already exists: ${product.name}`
                );
                continue;
            }

            console.log(
                `Adding product ${product.id}: ${product.name}`
            );

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error(
                    `Failed to add ${product.name}:`,
                    result
                );
                continue;
            }

            console.log(
                `Added successfully: ${product.name}`
            );
        }

        console.log("");
        console.log("Product seeding completed.");
        console.log("");

        const finalResponse = await fetch(API_URL);
        const finalData = await finalResponse.json();

        console.log(
            "Products currently in database:"
        );

        console.log(
            JSON.stringify(
                finalData.products,
                null,
                2
            )
        );

    } catch (error) {
        console.error(
            "Seed products error:",
            error.message
        );
    }
}

seedProducts();