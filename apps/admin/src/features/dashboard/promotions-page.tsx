import { FormEvent, useEffect, useState } from "react";

import { createBanner, createCoupon, getBanners, getCoupons } from "../../lib/api";

type Props = {
  token: string;
};

export function PromotionsPage({ token }: Props) {
  const [banners, setBanners] = useState<Array<Record<string, any>>>([]);
  const [coupons, setCoupons] = useState<Array<Record<string, any>>>([]);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaLabel: "Pedir agora",
    ctaLink: "/catalogo",
    target: "HOME"
  });
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    value: "10",
    minOrderValue: "25"
  });

  useEffect(() => {
    Promise.all([getBanners(token), getCoupons(token)])
      .then(([bannerResult, couponResult]) => {
        setBanners(bannerResult);
        setCoupons(couponResult);
      })
      .catch(() => {
        setBanners([]);
        setCoupons([]);
      });
  }, [token]);

  async function handleCreateBanner(event: FormEvent) {
    event.preventDefault();
    const created = await createBanner(token, bannerForm);
    setBanners((current) => [created as Record<string, any>, ...current]);
  }

  async function handleCreateCoupon(event: FormEvent) {
    event.preventDefault();
    const created = await createCoupon(token, {
      ...couponForm,
      value: Number(couponForm.value),
      minOrderValue: Number(couponForm.minOrderValue)
    });
    setCoupons((current) => [created as Record<string, any>, ...current]);
  }

  return (
    <section className="page-grid">
      <div className="page-columns">
        <article className="panel-card">
          <div className="section-head">
            <h2>Novo banner</h2>
            <span>Destaques premium da home</span>
          </div>
          <form className="form-grid" onSubmit={handleCreateBanner}>
            <input placeholder="Título" value={bannerForm.title} onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea placeholder="Subtítulo" value={bannerForm.subtitle} onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))} />
            <input placeholder="Imagem" value={bannerForm.imageUrl} onChange={(event) => setBannerForm((current) => ({ ...current, imageUrl: event.target.value }))} />
            <button className="primary-button" type="submit">
              Publicar banner
            </button>
          </form>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <h2>Novo cupom</h2>
            <span>Promoções sazonais</span>
          </div>
          <form className="form-grid" onSubmit={handleCreateCoupon}>
            <input placeholder="Código" value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
            <textarea placeholder="Descrição" value={couponForm.description} onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))} />
            <input placeholder="Valor" value={couponForm.value} onChange={(event) => setCouponForm((current) => ({ ...current, value: event.target.value }))} />
            <button className="primary-button" type="submit">
              Criar cupom
            </button>
          </form>
        </article>
      </div>

      <div className="page-columns">
        <article className="panel-card">
          <div className="section-head">
            <h2>Banners ativos</h2>
            <span>{banners.length} ativos</span>
          </div>
          <div className="list-stack">
            {banners.map((banner) => (
              <div className="list-row" key={banner.id}>
                <strong>{banner.title}</strong>
                <span>{banner.target}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <h2>Cupons ativos</h2>
            <span>{coupons.length} configurados</span>
          </div>
          <div className="list-stack">
            {coupons.map((coupon) => (
              <div className="list-row" key={coupon.id}>
                <strong>{coupon.code}</strong>
                <span>{coupon.discountType}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

