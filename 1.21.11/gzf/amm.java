import java.util.List;
import java.util.Map;

public class amm {
   private final String a;
   private final String b;

   public amm(String $$0, String $$1) {
      this.a = $$0;
      this.b = $$1;
   }

   public static amm a(String $$0) {
      return new amm($$0, ".json");
   }

   public static amm a(amt<? extends jq<?>> $$0) {
      return a(mj.c($$0));
   }

   public amo a(amo $$0) {
      String var10001 = this.a;
      return $$0.e(var10001 + "/" + $$0.a() + this.b);
   }

   public amo b(amo $$0) {
      String $$1 = $$0.a();
      return $$0.e($$1.substring(this.a.length() + 1, $$1.length() - this.b.length()));
   }

   public Map<amo, bax> a(baz $$0) {
      return $$0.b(this.a, ($$0x) -> {
         return $$0x.a().endsWith(this.b);
      });
   }

   public Map<amo, List<bax>> b(baz $$0) {
      return $$0.c(this.a, ($$0x) -> {
         return $$0x.a().endsWith(this.b);
      });
   }
}
