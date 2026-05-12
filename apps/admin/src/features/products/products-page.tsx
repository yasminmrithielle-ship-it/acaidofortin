import { FormEvent, useEffect, useMemo, useState } from "react";

import { createCategory, createProduct, getCategories, getProducts } from "../../lib/api";
import { formatCurrency } from "../../lib/format";

type Props = {
  token: string;
};

const defaultSizes = [
  { id: "300", name: "300ml", price: 18.9 },
  { id: "500", name: "500ml", price: 24.9 },
  { id: "700", name: "700ml", price: 31.9 }
];

const defaultAddOns = [
  { id: "banana", name: "Banana", price: 2.5 },
  { id: "granola", name: "Granola", price: 3.5 },
  { id: "nutella", name: "Nutella", price: 6.5 }
];

export function ProductsPage({ token }: Props) {
  const [products, setProducts] = useState<Array<Record<string, any>>>([]);
  const [categories, setCategories] = useState<Array<Record<string, any>>>([]);
  const [categoryName, setCategoryName] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    categoryId: "",
    basePrice: "18.9",
    stockQuantity: "20"
  });

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + Number(product.stockQuantity ?? 0), 0),
    [products]
  );

  useEffect(() => {
    Promise.all([getProducts(token), getCategories(token)])
      .then(([productResult, categoryResult]) => {
        setProducts(productResult);
        setCategories(categoryResult);
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      });
  }, [token]);

  async function handleCreateProduct(event: FormEvent) {
    event.preventDefault();

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      stockQuantity: Number(form.stockQuantity),
      sizes: defaultSizes,
      addOns: defaultAddOns,
      isFeatured: true
    };

    const created = await createProduct(token, payload);
    setProducts((current) => [created as Record<string, any>, ...current]);
    setForm({
      name: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      basePrice: "18.9",
      stockQuantity: "20"
    });
  }

  async function handleCreateCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryName.trim()) return;

    const created = await createCategory(token, {
      name: categoryName,
      sortOrder: categories.length + 1
    });

    setCategories((current) => [...current, created as Record<string, any>]);
    setCategoryName("");
  }

  return (
    <section className="page-grid">
      <div className="page-columns">
        <article className="panel-card">
          <div className="section-head">
            <h2>Novo produto</h2>
            <span>Sizes e adicionais padrão Fortin</span>
          </div>

          <form className="form-grid" onSubmit={handleCreateProduct}>
            <input placeholder="Nome do produto" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <textarea placeholder="Descrição" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <input placeholder="URL da imagem" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} />
            <select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
              <option value="">Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input placeholder="Preço base" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} />
            <input placeholder="Estoque" value={form.stockQuantity} onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))} />
            <button className="primary-button" type="submit">
              Salvar produto
            </button>
          </form>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <h2>Categorias</h2>
            <span>{categories.length} categorias cadastradas</span>
          </div>

          <form className="inline-form" onSubmit={handleCreateCategory}>
            <input placeholder="Nova categoria" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            <button className="ghost-button" type="submit">
              Adicionar
            </button>
          </form>

          <div className="pill-grid">
            {categories.map((category) => (
              <span className="chip" key={category.id}>
                {category.name}
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="panel-card">
        <div className="section-head">
          <h2>Estoque e catálogo</h2>
          <span>{products.length} produtos • {totalStock} itens em estoque</span>
        </div>
        <div className="table-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <p>{product.category?.name ?? "Sem categoria"}</p>
              </div>
              <p>{formatCurrency(Number(product.basePrice))}</p>
              <p>Estoque: {product.stockQuantity}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

