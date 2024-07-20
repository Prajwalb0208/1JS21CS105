const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const TIMEOUT = 500; // Timeout in milliseconds

const AUTH_URL = 'http://20.244.56.144/test/auth';
const TOKEN_URL = 'http://20.244.56.144/test/companies';

let authToken = '';

const getAuthToken = async () => {
    try {
        const response = await axios.post(AUTH_URL, {
            "companyName": "jssateb",
            "clientID": "12a1fe10-8d26-46ae-a50c-dbd203e2af3a",
            "clientSecret": "YotPvlrWcAPNoOiB",
            "ownerName": "PrajwalB",
            "ownerEmail": "prajwalb0208@gmail.com",
            "rollNo": "1JS21CS105"
        });
        authToken = response.data.access_token;
    } catch (error) {
        console.error('Error fetching auth token:', error.message || error);
    }
};

const fetchProductsFromCompany = async (company, category, top, minPrice, maxPrice) => {
    const url = `${TOKEN_URL}/${company}/categories/${category}/products?top=${top}&minPrice=${minPrice}&maxPrice=${maxPrice}`;
    try {
        const response = await axios.get(url, {
            timeout: TIMEOUT,
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error.message || error);
        return [];
    }
};

app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top = 10, page = 1, minPrice = 0, maxPrice = 10000, sort = 'price' } = req.query;

    if (!CATEGORIES.includes(categoryname)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    if (!authToken) {
        await getAuthToken();
    }

    if (top > 10) {
        const products = await Promise.all(COMPANIES.map(company => fetchProductsFromCompany(company, categoryname, top, minPrice, maxPrice)));
        let allProducts = products.flat();

        // Remove duplicates
        allProducts = Array.from(new Set(allProducts.map(p => JSON.stringify(p)))
                             .map(e => JSON.parse(e)));

        // Sort
        allProducts.sort((a, b) => a[sort] - b[sort]);

        // Pagination
        const start = (page - 1) * top;
        const paginatedProducts = allProducts.slice(start, start + top);

        res.json({ products: paginatedProducts });
    } else {
        const products = await Promise.all(COMPANIES.map(company => fetchProductsFromCompany(company, categoryname, top, minPrice, maxPrice)));
        let allProducts = products.flat();

        // Remove duplicates
        allProducts = Array.from(new Set(allProducts.map(p => JSON.stringify(p)))
                             .map(e => JSON.parse(e)));

        // Sort
        allProducts.sort((a, b) => a[sort] - b[sort]);

        // Limit the number of products
        const limitedProducts = allProducts.slice(0, top);

        res.json({ products: limitedProducts });
    }
});

app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    if (!CATEGORIES.includes(categoryname)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    if (!authToken) {
        await getAuthToken();
    }

    const products = await Promise.all(COMPANIES.map(company => fetchProductsFromCompany(company, categoryname, 100, 0, 10000)));
    let allProducts = products.flat();

    // Find the product by ID
    const product = allProducts.find(p => p.id === productid);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
