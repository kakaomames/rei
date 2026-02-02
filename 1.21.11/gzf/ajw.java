public record ajw(short b, dlt c) implements aay<aib> {
   public static final aao<xq, ajw> a;

   public ajw(int $$0, dlt $$1) {
      this((short)$$0, $$1);
   }

   public ajw(short param1, dlt param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ajw> a() {
      return ahz.cm;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public short b() {
      return this.b;
   }

   public dlt e() {
      return this.c;
   }

   static {
      a = aao.a(aam.e, ajw::b, dlt.a(dlt.i), ajw::e, ajw::new);
   }
}
