import it.unimi.dsi.fastutil.objects.Object2IntMap;
import it.unimi.dsi.fastutil.objects.Object2IntOpenHashMap;

public record ade(Object2IntMap<bdh<?>> b) implements aay<adb> {
   private static final aao<xq, Object2IntMap<bdh<?>>> c;
   public static final aao<xq, ade> a;

   public ade(Object2IntMap<bdh<?>> param1) {
      this.b = $$0;
   }

   public aba<ade> a() {
      return ahz.e;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public Object2IntMap<bdh<?>> b() {
      return this.b;
   }

   static {
      c = aam.a(Object2IntOpenHashMap::new, bdh.a, aam.h);
      a = c.a(ade::new, ade::b);
   }
}
