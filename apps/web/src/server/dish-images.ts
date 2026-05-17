/** Imagen principal por plato (Unsplash, una URL única y acorde al producto). */
const U = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const DISH_IMAGES: Record<string, string> = {
  'd-ramen': U('photo-1569718212165-3a8278d5f624'),
  'd-gyozas': U('photo-1496116218417-1a781b67df0e'),
  'd-poke': U('photo-1546069901-ba9599a7e63c'),
  'd-bowl-med': U('photo-1512621776951-a57141f2eefd'),
  'd-ensalada-cesar': U('photo-1551248429-40975aa4de74'),
  'd-pizza-marg': U('photo-1574071318508-1cdbab80d002'),
  'd-pizza-diavola': U('photo-1593504049359-74330189a345'),
  'd-burger': U('photo-1568901346375-23c9450c58cd'),
  'd-patatas': U('photo-1518013431117-eb1465fa5752'),
  'd-tiramisu': U('photo-1571877227200-a0d98ea607e9'),
  'd-brownie': U('photo-1606313564200-e75d5e30476c'),
  'd-limonada': U('photo-1497534446932-c925b458314e'),
  'd-pizza-4formaggi': U('photo-1513104890138-7c749659a591'),
  'd-pizza-pepperoni': U('photo-1628840042765-356cda07504e'),
  'd-pizza-vegana': U('photo-1571997463535-a7cbdaef7779'),
  'd-lasagna': U('photo-1621996346565-e3dbc646d9a9'),
  'd-carbonara': U('photo-1612874742137-652c2a9d3653'),
  'd-pesto': U('photo-1473093295047-4ddfd7ba2c7c'),
  'd-ravioli': U('photo-1587740904311-2d7f4a2c4e0a'),
  'd-risotto': U('photo-1476124369801-b43f9aef2f0b'),
  'd-fabada': U('photo-1547592166-23ac45744acd'),
  'd-callos': U('photo-1604908176997-4313efdd2453'),
  'd-cocido': U('photo-1604908177522-402cfa3a0c0a'),
  'd-gazpacho': U('photo-1540420773420-3366772f4999'),
  'd-padthai': U('photo-1559314809-0d31640f0a27'),
  'd-smash-doble': U('photo-1553979459-d2229ba7433b'),
  'd-alitas': U('photo-1608039829572-78524f79c4c7'),
  'd-croquetas': U('photo-1601050690597-df57b8c1ed45'),
  'd-panna-cotta': U('photo-1488477181946-6428a0291777'),
  'd-coca-cola': U('photo-1629203851122-3726ecdf080e'),
  'd-pepsi': U('photo-1554866585-2f025a5bdd65'),
  'd-fanta': U('photo-1624517452648-048a0c46dd66'),
  'd-aquarius': U('photo-1546173159-315724a3160b'),
  'd-monster': U('photo-1622543562537-54413184e6af'),
  'd-menu-dia-paella': U('photo-1534080564583-591bebc13fec'),
  'd-menu-dia-lasana': U('photo-1574894709920-7b0e6b8b2b8a'),
  'd-menu-dia-bowl': U('photo-1546069901-ba9599a7e63c'),
};

export function applyDishImages<T extends { id: string; images: string[] }>(dishes: T[]): T[] {
  for (const d of dishes) {
    const canonical = DISH_IMAGES[d.id];
    if (canonical) d.images = [canonical];
  }
  return dishes;
}
