import java.util.List;

public record adv(int b, int c, List<dlt> d, dlt e) implements aay<adb> {
   public static final aao<xq, adv> a;

   public adv(int param1, int param2, List<dlt> param3, dlt param4) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
   }

   public aba<adv> a() {
      return ahz.t;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public int e() {
      return this.c;
   }

   public List<dlt> f() {
      return this.d;
   }

   public dlt g() {
      return this.e;
   }

   static {
      a = aao.a(aam.x, adv::b, aam.h, adv::e, dlt.k, adv::f, dlt.h, adv::g, adv::new);
   }
}
